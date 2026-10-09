import prisma from '../config/prisma';
import { io } from '../index';
import { EntryStatus, CounterStatus, LobbyDisplayMode } from '@prisma/client';
import { logAuditEvent } from '../utils/audit';

export interface LobbyNowServingItem {
  entryId: string;
  ticketNumber: string;
  counterNumber: string;
  counterName?: string | null;
  serviceId: string;
  serviceName: string;
  status: EntryStatus;
  calledAt?: Date | null;
  servingAt?: Date | null;
}

export interface LobbyQueueOverviewItem {
  serviceId: string;
  serviceName: string;
  waitingCount: number;
  estimatedWaitMinutes: number;
  activeCountersCount: number;
}

export interface LobbyStateResponse {
  branch: {
    id: string;
    name: string;
    organizationId: string;
    organizationName: string;
    operatingHours?: string | null;
  };
  displayMode: LobbyDisplayMode;
  nowServing: LobbyNowServingItem[];
  queueOverview: LobbyQueueOverviewItem[];
  announcement?: {
    latestCalledTicket?: string | null;
    latestCounter?: string | null;
    announcementText?: string | null;
  } | null;
  timestamp: string;
}

export interface UpdateLobbyDisplayParams {
  branchId: string;
  name?: string;
  mode?: LobbyDisplayMode;
  serviceIds?: string[];
  voiceEnabled?: boolean;
  announcementTemplate?: string;
}

/**
 * Returns privacy-sanitized authoritative Lobby Display state (Part 18, 19, 32)
 * Strictly strips any customer personal info (names, phones, emails, Ghana Card).
 */
export async function getLobbyState(branchId: string): Promise<LobbyStateResponse> {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!branch || !branch.isActive) {
    throw new Error('Branch not found or currently inactive');
  }

  // 1. Fetch currently CALLING or SERVING tickets for this branch
  const activeEntries = await prisma.queueEntry.findMany({
    where: {
      queue: { branchId },
      status: { in: [EntryStatus.CALLING, EntryStatus.SERVING] },
    },
    orderBy: [
      { calledAt: 'desc' },
      { servingAt: 'desc' },
    ],
    take: 12,
    include: {
      queue: {
        include: { service: { select: { id: true, name: true, duration: true } } },
      },
    },
  });

  // Map to strictly privacy-safe items (Part 19: Ticket number, Counter, Service only)
  const nowServing: LobbyNowServingItem[] = activeEntries.map((entry) => ({
    entryId: entry.id,
    ticketNumber: entry.ticketNumber || `#${entry.position}`,
    counterNumber: entry.counterNumber || 'Counter 1',
    serviceId: entry.queue.service.id,
    serviceName: entry.queue.service.name,
    status: entry.status,
    calledAt: entry.calledAt,
    servingAt: entry.servingAt,
  }));

  // 2. Fetch Queue Overview across services in this branch
  const services = await prisma.service.findMany({
    where: { branchId, isActive: true },
    include: {
      queues: {
        where: { status: 'OPEN' },
      },
      counters: {
        where: { isActive: true, status: { not: CounterStatus.OFFLINE } },
      },
    },
    orderBy: { name: 'asc' },
  });

  const queueOverview: LobbyQueueOverviewItem[] = await Promise.all(
    services.map(async (service) => {
      const queue = service.queues[0];
      let waitingCount = 0;
      if (queue && prisma.queueEntry && typeof prisma.queueEntry.count === 'function') {
        waitingCount = await prisma.queueEntry.count({
          where: {
            queueId: queue.id,
            status: EntryStatus.WAITING,
          },
        });
      }

      const activeCountersCount = service.counters ? service.counters.length : 1;
      const estimatedWaitMinutes = Math.max(
        3,
        Math.ceil((waitingCount * (service.duration || 10)) / Math.max(1, activeCountersCount))
      );

      return {
        serviceId: service.id,
        serviceName: service.name,
        waitingCount,
        estimatedWaitMinutes,
        activeCountersCount,
      };
    })
  );

  // 3. Resolve display settings/mode
  let displayMode: LobbyDisplayMode = LobbyDisplayMode.COMBINED;
  let voiceEnabled = true;

  if (prisma.lobbyDisplay && typeof prisma.lobbyDisplay.findFirst === 'function') {
    const config = await prisma.lobbyDisplay.findFirst({
      where: { branchId, isActive: true },
    });
    if (config) {
      displayMode = config.mode;
      voiceEnabled = config.voiceEnabled;
    }
  }

  // 4. Build announcement message for the most recently called ticket
  const latestCalled = nowServing.find((item) => item.status === EntryStatus.CALLING) || nowServing[0];
  const announcement = latestCalled
    ? {
        latestCalledTicket: latestCalled.ticketNumber,
        latestCounter: latestCalled.counterNumber,
        announcementText: `Ticket ${latestCalled.ticketNumber}, please proceed to ${latestCalled.counterNumber}.`,
      }
    : null;

  return {
    branch: {
      id: branch.id,
      name: branch.name,
      organizationId: branch.organizationId,
      organizationName: branch.organization.name,
      operatingHours: branch.operatingHours,
    },
    displayMode,
    nowServing,
    queueOverview,
    announcement: voiceEnabled ? announcement : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Configure or create a Lobby Display configuration for a branch (Part 39)
 */
export async function upsertLobbyDisplay(params: UpdateLobbyDisplayParams, staffUserId?: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: params.branchId },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  let existing = null;
  if (prisma.lobbyDisplay && typeof prisma.lobbyDisplay.findFirst === 'function') {
    existing = await prisma.lobbyDisplay.findFirst({
      where: { branchId: params.branchId },
    });
  }

  let display: any;
  if (existing) {
    display = await prisma.lobbyDisplay.update({
      where: { id: existing.id },
      data: {
        name: params.name !== undefined ? params.name : undefined,
        mode: params.mode !== undefined ? params.mode : undefined,
        serviceIds: params.serviceIds !== undefined ? params.serviceIds : undefined,
        voiceEnabled: params.voiceEnabled !== undefined ? params.voiceEnabled : undefined,
        announcementTemplate: params.announcementTemplate !== undefined ? params.announcementTemplate : undefined,
      },
    });
  } else {
    display = await prisma.lobbyDisplay.create({
      data: {
        organizationId: branch.organizationId,
        branchId: params.branchId,
        name: params.name || `${branch.name} Lobby Display`,
        mode: params.mode || LobbyDisplayMode.COMBINED,
        serviceIds: params.serviceIds || [],
        voiceEnabled: params.voiceEnabled !== undefined ? params.voiceEnabled : true,
        announcementTemplate: params.announcementTemplate || 'Ticket {ticket}, please proceed to {counter}',
        isActive: true,
      },
    });
  }

  await logAuditEvent({
    organizationId: branch.organizationId,
    branchId: branch.id,
    userId: staffUserId || 'SYSTEM',
    action: 'LOBBY_DISPLAY_CONFIG_UPDATED',
    details: {
      lobbyDisplayId: display.id,
      mode: display.mode,
      voiceEnabled: display.voiceEnabled,
    },
  });

  await broadcastLobbyUpdate(params.branchId, 'LOBBY_CONFIG_UPDATED', {
    displayId: display.id,
    mode: display.mode,
  });

  return display;
}

/**
 * Real-time Lobby broadcast helper (Part 17, 34)
 * Emits to branch and lobby rooms with minimal overhead.
 */
export async function broadcastLobbyUpdate(
  branchId: string,
  eventType: string,
  extraPayload?: Record<string, any>
) {
  if (!io) return;

  try {
    const updatedState = await getLobbyState(branchId).catch(() => null);

    const payload = {
      branchId,
      eventType,
      timestamp: new Date().toISOString(),
      state: updatedState,
      ...extraPayload,
    };

    io.to(`branch_${branchId}`).emit('lobby_updated', payload);
    io.to(`lobby_${branchId}`).emit('lobby_updated', payload);
  } catch (err) {
    console.error('Error broadcasting lobby update:', err);
  }
}
