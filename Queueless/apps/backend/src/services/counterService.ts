import prisma from '../config/prisma';
import { io } from '../index';
import { CounterStatus } from '@prisma/client';
import { logAuditEvent } from '../utils/audit';

export interface CreateCounterParams {
  branchId: string;
  counterNumber: string;
  name?: string;
}

/**
 * Creates a new physical service desk/counter for a branch (Part 22)
 */
export async function createCounter(params: CreateCounterParams, staffUserId?: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: params.branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  const existing = await prisma.serviceCounter.findUnique({
    where: {
      branchId_counterNumber: {
        branchId: params.branchId,
        counterNumber: params.counterNumber.trim(),
      },
    },
  });

  if (existing) {
    throw new Error(`Counter ${params.counterNumber} already exists in this branch`);
  }

  const counter = await prisma.serviceCounter.create({
    data: {
      branchId: params.branchId,
      counterNumber: params.counterNumber.trim(),
      name: params.name?.trim() || null,
      status: CounterStatus.AVAILABLE,
      isActive: true,
    },
    include: {
      branch: { select: { id: true, name: true, location: true } },
    },
  });

  await logAuditEvent({
    organizationId: branch.organizationId,
    branchId: branch.id,
    userId: staffUserId || 'SYSTEM',
    action: 'COUNTER_CREATED',
    details: {
      counterId: counter.id,
      counterNumber: counter.counterNumber,
      name: counter.name,
    },
  });

  if (io) {
    io.to(`branch_${params.branchId}`).emit('counter_created', { counter });
  }

  return counter;
}

/**
 * List all active service counters for a branch
 */
export async function getCountersByBranch(branchId: string) {
  if (!prisma.serviceCounter || typeof prisma.serviceCounter.findMany !== 'function') {
    return [];
  }
  return await prisma.serviceCounter.findMany({
    where: { branchId, isActive: true },
    orderBy: { counterNumber: 'asc' },
    include: {
      currentStaff: { select: { id: true, fullName: true, email: true } },
      currentService: { select: { id: true, name: true } },
    },
  });
}

/**
 * Update counter status (AVAILABLE, SERVING, PAUSED, OFFLINE) with real-time sync (Part 22 & 34)
 */
export async function setCounterStatus(
  counterId: string,
  status: CounterStatus,
  staffUserId?: string,
  extraDetails?: { ticketNumber?: string | null; entryId?: string | null; serviceId?: string | null }
) {
  const counter = await prisma.serviceCounter.findUnique({
    where: { id: counterId },
    include: { branch: true },
  });

  if (!counter) {
    throw new Error('Counter not found');
  }

  const updateData: any = {
    status,
  };

  if (extraDetails) {
    if (extraDetails.ticketNumber !== undefined) updateData.currentTicketNumber = extraDetails.ticketNumber;
    if (extraDetails.entryId !== undefined) updateData.currentEntryId = extraDetails.entryId;
    if (extraDetails.serviceId !== undefined) updateData.currentServiceId = extraDetails.serviceId;
  }

  const updated = await prisma.serviceCounter.update({
    where: { id: counterId },
    data: updateData,
    include: {
      currentStaff: { select: { id: true, fullName: true } },
      currentService: { select: { id: true, name: true } },
    },
  });

  await logAuditEvent({
    organizationId: counter.branch.organizationId,
    branchId: counter.branchId,
    userId: staffUserId || 'SYSTEM',
    action: 'COUNTER_STATUS_CHANGED',
    details: {
      counterId,
      counterNumber: counter.counterNumber,
      status,
      ticketNumber: updated.currentTicketNumber,
    },
  });

  if (io) {
    io.to(`branch_${counter.branchId}`).emit('counter_status_changed', { counter: updated });
    io.to(`lobby_${counter.branchId}`).emit('lobby_updated', { type: 'COUNTER_STATUS_CHANGED', counter: updated });
  }

  return updated;
}

/**
 * Assign staff member to counter
 */
export async function assignStaffToCounter(
  counterId: string,
  staffUserId: string,
  serviceId?: string | null,
  requestingUserId?: string
) {
  const counter = await prisma.serviceCounter.findUnique({
    where: { id: counterId },
    include: { branch: true },
  });

  if (!counter) {
    throw new Error('Counter not found');
  }

  const staffUser = await prisma.user.findUnique({
    where: { id: staffUserId },
  });

  if (!staffUser) {
    throw new Error('Staff user not found');
  }

  if (staffUser.staffBranchId && staffUser.staffBranchId !== counter.branchId) {
    throw new Error('Staff is not authorized for counters in this branch');
  }

  const updated = await prisma.serviceCounter.update({
    where: { id: counterId },
    data: {
      currentStaffId: staffUserId,
      currentServiceId: serviceId !== undefined ? serviceId : undefined,
      status: CounterStatus.AVAILABLE,
    },
    include: {
      currentStaff: { select: { id: true, fullName: true } },
      currentService: { select: { id: true, name: true } },
    },
  });

  if (io) {
    io.to(`branch_${counter.branchId}`).emit('counter_updated', { counter: updated });
  }

  return updated;
}

/**
 * Delete or deactivate counter
 */
export async function deleteCounter(counterId: string, staffUserId?: string) {
  const counter = await prisma.serviceCounter.findUnique({
    where: { id: counterId },
    include: { branch: true },
  });

  if (!counter) {
    throw new Error('Counter not found');
  }

  const updated = await prisma.serviceCounter.update({
    where: { id: counterId },
    data: {
      isActive: false,
      status: CounterStatus.OFFLINE,
      currentStaffId: null,
    },
  });

  await logAuditEvent({
    organizationId: counter.branch.organizationId,
    branchId: counter.branchId,
    userId: staffUserId || 'SYSTEM',
    action: 'COUNTER_DEACTIVATED',
    details: { counterId, counterNumber: counter.counterNumber },
  });

  return updated;
}
