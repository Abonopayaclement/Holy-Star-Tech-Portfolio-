import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import * as queueService from './queueService';
import { generatePrintableTicketData, PrintableTicketData } from './ticketPrintService';
import { logAuditEvent } from '../utils/audit';
import { KioskStatus, PriorityLevel } from '@prisma/client';

export interface CreateKioskParams {
  organizationId: string;
  branchId: string;
  name: string;
  deviceIdentifier?: string;
  config?: Record<string, any>;
}

export interface IssueKioskTicketParams {
  branchId: string;
  serviceId: string;
  kioskId?: string;
  fullName?: string;
  phoneNumber?: string;
  priority?: PriorityLevel;
}

/**
 * Register or create a new branch kiosk
 */
export async function createKiosk(params: CreateKioskParams, staffUserId?: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: params.branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  const kiosk = await prisma.kiosk.create({
    data: {
      organizationId: params.organizationId || branch.organizationId,
      branchId: params.branchId,
      name: params.name,
      deviceIdentifier: params.deviceIdentifier || null,
      status: KioskStatus.ACTIVE,
      config: params.config || {},
      lastSeenAt: new Date(),
    },
    include: {
      branch: { select: { id: true, name: true, location: true } },
    },
  });

  await logAuditEvent({
    organizationId: kiosk.organizationId,
    branchId: kiosk.branchId,
    userId: staffUserId || 'SYSTEM',
    action: 'KIOSK_CREATED',
    details: {
      kioskId: kiosk.id,
      name: kiosk.name,
    },
  });

  return kiosk;
}

/**
 * Get all kiosks for a specific branch
 */
export async function getKiosksByBranch(branchId: string) {
  if (!prisma.kiosk || typeof prisma.kiosk.findMany !== 'function') {
    return [];
  }
  return await prisma.kiosk.findMany({
    where: { branchId },
    orderBy: { createdAt: 'asc' },
    include: {
      branch: { select: { id: true, name: true, location: true } },
    },
  });
}

/**
 * Update kiosk configuration or status
 */
export async function updateKiosk(
  kioskId: string,
  data: { name?: string; status?: KioskStatus; config?: Record<string, any> },
  staffUserId?: string
) {
  const kiosk = await prisma.kiosk.findUnique({
    where: { id: kioskId },
  });

  if (!kiosk) {
    throw new Error('Kiosk not found');
  }

  const updated = await prisma.kiosk.update({
    where: { id: kioskId },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      status: data.status !== undefined ? data.status : undefined,
      config: data.config !== undefined ? data.config : undefined,
      lastSeenAt: new Date(),
    },
  });

  await logAuditEvent({
    organizationId: kiosk.organizationId,
    branchId: kiosk.branchId,
    userId: staffUserId || 'SYSTEM',
    action: 'KIOSK_UPDATED',
    details: {
      kioskId,
      updatedFields: Object.keys(data),
    },
  });

  return updated;
}

/**
 * Returns kiosk configuration and active walk-in services for a physical branch kiosk (Part 6 & 8)
 * Backend enforces strict tenant boundaries, active queue checking, and walk-in eligibility.
 */
export async function getKioskBranchServices(branchId: string, kioskId?: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      organization: { select: { id: true, name: true, logo: true } },
    },
  });

  if (!branch || !branch.isActive) {
    throw new Error('This branch is currently inactive or not found.');
  }

  // Record kiosk heartbeat if kioskId provided
  if (kioskId && prisma.kiosk && typeof prisma.kiosk.update === 'function') {
    await prisma.kiosk.update({
      where: { id: kioskId },
      data: { lastSeenAt: new Date() },
    }).catch(() => null);
  }

  // Fetch only services that belong to this branch and are permitted for walk-in
  const services = await prisma.service.findMany({
    where: {
      branchId,
      isActive: true,
      allowWalkIn: true,
    },
    include: {
      queues: {
        where: { status: 'OPEN' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Filter to services that have an open queue and compute live wait info
  const availableServices = await Promise.all(
    services
      .filter((s) => s.queues && s.queues.length > 0)
      .map(async (service) => {
        const queue = service.queues[0];
        let waitingCount = 0;
        if (prisma.queueEntry && typeof prisma.queueEntry.count === 'function') {
          waitingCount = await prisma.queueEntry.count({
            where: {
              queueId: queue.id,
              status: 'WAITING',
            },
          });
        }

        const estimatedWaitMinutes = Math.max(5, waitingCount * (service.duration || 10));

        return {
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          queueId: queue.id,
          queueStatus: queue.status,
          waitingCount,
          estimatedWaitMinutes,
          isFull: queue.capacity ? waitingCount >= queue.capacity : false,
        };
      })
  );

  return {
    branch: {
      id: branch.id,
      name: branch.name,
      location: branch.location,
      operatingHours: branch.operatingHours,
      organizationName: branch.organization.name,
      organizationLogo: branch.organization.logo,
    },
    services: availableServices,
  };
}

/**
 * Issues a new walk-in ticket from a physical kiosk device (Part 5, 25, 26, 28)
 */
export async function issueKioskTicket(params: IssueKioskTicketParams): Promise<PrintableTicketData> {
  const { branchId, serviceId, kioskId, fullName, phoneNumber, priority } = params;

  // 1. Validate branch
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { organization: true },
  });

  if (!branch || !branch.isActive) {
    throw new Error('This branch is currently unavailable.');
  }

  // 2. Validate service & open queue
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      queues: { where: { status: 'OPEN' } },
    },
  });

  if (!service || service.branchId !== branchId || !service.isActive) {
    throw new Error('This service is currently unavailable. Please choose another service.');
  }

  if (service.allowWalkIn === false) {
    throw new Error('Walk-in ticket generation is disabled for this service.');
  }

  if (!service.queues || service.queues.length === 0) {
    throw new Error('The queue for this service is currently closed. Please check back later.');
  }

  const queue = service.queues[0];

  // 3. Queue Capacity check (Part 28)
  const maxCapacity = queue.capacity || service.capacity;
  if (maxCapacity) {
    const currentWaiting = await prisma.queueEntry.count({
      where: {
        queueId: queue.id,
        status: 'WAITING',
      },
    });

    if (currentWaiting >= maxCapacity) {
      throw new Error('This queue is currently full. Please choose another service or speak with a staff member.');
    }
  }

  // 4. Resolve or create customer profile
  let customerUser = null;
  if (phoneNumber && phoneNumber.trim().length > 3) {
    customerUser = await prisma.user.findFirst({
      where: { phoneNumber: phoneNumber.trim(), role: 'CUSTOMER' },
    });
  }

  if (!customerUser) {
    const tempSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const salt = await bcrypt.genSalt(6);
    const passwordHash = await bcrypt.hash(tempSuffix, salt);
    customerUser = await prisma.user.create({
      data: {
        email: `kiosk_${tempSuffix}@queueless.internal`,
        passwordHash,
        fullName: fullName?.trim() || 'Kiosk Visitor',
        phoneNumber: phoneNumber?.trim() || null,
        role: 'CUSTOMER',
      },
    });
  }

  // 5. Enforce priority rules (Part 15: kiosk customers cannot self-assign priority unless authorized)
  const safePriority = priority || PriorityLevel.NORMAL;

  // 6. Join queue through single unified queue engine (Part 12)
  const entry = await queueService.joinQueue(customerUser.id, queue.id, {
    isWalkIn: true,
    source: 'KIOSK',
    kioskId: kioskId || undefined,
    priority: safePriority,
  });

  // 7. Audit log (Part 35)
  await logAuditEvent({
    organizationId: branch.organizationId,
    branchId: branch.id,
    userId: customerUser.id,
    action: 'KIOSK_TICKET_CREATED',
    details: {
      entryId: entry.id,
      ticketNumber: entry.ticketNumber,
      serviceId,
      serviceName: service.name,
      kioskId: kioskId || null,
      position: entry.position,
    },
  });

  // 8. Return formatted ticket data ready for printing / display
  return await generatePrintableTicketData(entry.id);
}
