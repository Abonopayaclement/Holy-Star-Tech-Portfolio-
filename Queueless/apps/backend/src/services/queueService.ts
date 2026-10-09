import prisma from '../config/prisma';
import { io } from '../index';
import { EntryStatus, PriorityLevel, NotificationPreference, TicketSource } from '@prisma/client';
import { logAuditEvent } from '../utils/audit';
import { calculateQueueEta } from './etaService';
import * as notificationService from './notificationService';
import * as callbackService from './callbackService';
import { generateTicketNumber } from './ticketNumberService';
import { broadcastLobbyUpdate } from './lobbyService';

/**
 * Monitor queue progress and dispatch milestone notifications (e.g. ~5 ahead, ~2 ahead)
 * without duplicate messages.
 */
export const notifyQueueMilestones = async (queueId: string) => {
  try {
    if (!prisma.queueEntry || typeof prisma.queueEntry.findMany !== 'function') return;

    const waitingEntries = await prisma.queueEntry.findMany({
      where: {
        queueId,
        status: EntryStatus.WAITING,
      },
      orderBy: { position: 'asc' },
      include: {
        queue: { include: { service: true, branch: true } },
      },
    });

    if (!waitingEntries || !Array.isArray(waitingEntries)) return;

    for (let i = 0; i < waitingEntries.length; i++) {
      const entry = waitingEntries[i];
      const peopleAhead = i; // since ordered by position asc
      const ticketNum = entry.ticketNumber || `#${entry.position}`;
      const serviceName = entry.queue.service.name;

      const pref = entry.notificationPreference || NotificationPreference.STANDARD;
      if (pref === NotificationPreference.NOTIFY_CALLED_ONLY) {
        continue;
      }

      if (peopleAhead <= 2) {
        const alreadyNotified = await notificationService.hasMilestoneBeenNotified(
          entry.userId,
          entry.id,
          'QUEUE_MILESTONE_2'
        );
        if (!alreadyNotified) {
          await notificationService.createNotification({
            userId: entry.userId,
            branchId: entry.queue.branchId,
            organizationId: entry.queue.branch.organizationId,
            type: 'QUEUE_MILESTONE_2',
            title: 'Your turn is coming up',
            message: `You have ${peopleAhead} ${peopleAhead === 1 ? 'customer' : 'customers'} ahead of you for ticket ${ticketNum} (${serviceName}). Please proceed near the service counter.`,
            priority: 'IMPORTANT',
            entityType: 'QUEUE_ENTRY',
            entityId: entry.id,
            metadata: {
              ticketId: entry.id,
              ticketNumber: ticketNum,
              queueId: entry.queueId,
              peopleAhead,
              milestone: 2,
            },
          });
        }
      } else if (peopleAhead <= 5 && pref !== NotificationPreference.NOTIFY_APPROACHING_2) {
        const alreadyNotified = await notificationService.hasMilestoneBeenNotified(
          entry.userId,
          entry.id,
          'QUEUE_MILESTONE_5'
        );
        if (!alreadyNotified) {
          await notificationService.createNotification({
            userId: entry.userId,
            branchId: entry.queue.branchId,
            organizationId: entry.queue.branch.organizationId,
            type: 'QUEUE_MILESTONE_5',
            title: 'Your turn is coming up',
            message: `You have approximately ${peopleAhead} customers ahead of you for ticket ${ticketNum} (${serviceName}).`,
            priority: 'INFO',
            entityType: 'QUEUE_ENTRY',
            entityId: entry.id,
            metadata: {
              ticketId: entry.id,
              ticketNumber: ticketNum,
              queueId: entry.queueId,
              peopleAhead,
              milestone: 5,
            },
          });
        }
      }

      // Authoritative evaluation of callback requests
      await callbackService.evaluateCallbacksForEntry({
        queueEntryId: entry.id,
        peopleAhead,
        isCalled: false,
      });
    }
  } catch (err) {
    console.error('Failed to notify queue milestones:', err);
  }
};

/**
 * Join a queue safely with atomic position assignment, ticket number generation,
 * and duplicate entry prevention.
 */
export const joinQueue = async (
  userId: string, 
  queueId: string, 
  options?: {
    isRemote?: boolean;
    isWalkIn?: boolean;
    isQr?: boolean;
    qrId?: string;
    priority?: PriorityLevel;
    notificationPreference?: NotificationPreference;
    source?: TicketSource | string;
    kioskId?: string;
    customPrefix?: string;
  }
) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify queue and fetch service
    const queue = await tx.queue.findUnique({
      where: { id: queueId },
      include: { service: true, branch: true },
    });

    if (!queue) {
      throw new Error('Queue not found');
    }

    if (queue.status === 'CLOSED') {
      const hours = queue.branch.operatingHours ? ` (${queue.branch.operatingHours})` : '';
      throw new Error(`Queue Currently Closed: ${queue.service.name} is not accepting new customers right now. Existing customers are still being served. Please try again later.${hours ? ' Operating hours: ' + hours : ''}`);
    }

    // 2. Check channel permissions
    if (options?.isRemote && queue.service.allowRemoteJoin === false) {
      throw new Error('Remote queue joining is disabled for this service. Please join on-site at the branch.');
    }
    if (options?.isQr && queue.service.allowQrJoin === false) {
      throw new Error('QR code queue joining is disabled for this service. Please join through the mobile app.');
    }
    if (options?.isWalkIn && queue.service.allowWalkIn === false) {
      throw new Error('Walk-in queue joining is disabled for this service.');
    }
    if (options?.priority && options.priority !== PriorityLevel.NORMAL && queue.service.priorityEnabled === false) {
      throw new Error('Priority ticketing is disabled for this service.');
    }

    // 3. Check queue capacity limits if configured
    const capacityLimit = queue.capacity || queue.service.capacity;
    if (capacityLimit && capacityLimit > 0) {
      const activeWaitingCount = await tx.queueEntry.count({
        where: {
          queueId,
          status: EntryStatus.WAITING,
        },
      });
      if (activeWaitingCount >= capacityLimit) {
        throw new Error('This queue has reached its maximum capacity. Please try again later.');
      }
    }

    // 4. Prevent duplicate active entry in this queue
    const existingActive = await tx.queueEntry.findFirst({
      where: {
        queueId,
        userId,
        status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] },
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        queue: { include: { service: true, branch: true } },
      },
    });

    if (existingActive) {
      return { entry: existingActive, ticketNumber: existingActive.ticketNumber, nextPosition: existingActive.position, isExisting: true };
    }

    // 5. Compute last position
    const lastEntry = await tx.queueEntry.findFirst({
      where: { queueId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const nextPosition = (lastEntry?.position || 0) + 1;

    // 6. Generate structured ticket number (e.g., A001, A023)
    let ticketNumber = '';
    try {
      ticketNumber = await generateTicketNumber(
        {
          branchId: queue.branchId,
          serviceId: queue.serviceId,
          serviceName: queue.service.name,
          customPrefix: options?.customPrefix,
        },
        tx
      );
    } catch {
      const servicePrefix = (queue.service.name[0] || 'A').toUpperCase();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = await tx.queueEntry.count({
        where: {
          queueId,
          joinedAt: { gte: today },
        },
      });

      ticketNumber = `${servicePrefix}${String(todayCount + 1).padStart(3, '0')}`;
    }

    const resolvedSource = (options?.source as TicketSource) || (
      options?.isWalkIn ? TicketSource.WALK_IN :
      options?.isQr ? TicketSource.QR :
      options?.isRemote ? TicketSource.REMOTE :
      TicketSource.REMOTE
    );

    // 7. Create queue entry with priority and notification preference
    const entry = await tx.queueEntry.create({
      data: {
        userId,
        queueId,
        position: nextPosition,
        ticketNumber,
        status: EntryStatus.WAITING,
        priority: options?.priority || PriorityLevel.NORMAL,
        notificationPreference: options?.notificationPreference || NotificationPreference.STANDARD,
        source: resolvedSource,
        kioskId: options?.kioskId || null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        queue: { include: { service: true, branch: true } },
      },
    });

    // 8. Audit log with specific event type
    const auditAction = options?.source === 'KIOSK'
      ? 'KIOSK_TICKET_CREATED'
      : options?.isWalkIn
      ? 'WALK_IN_TICKET_CREATED'
      : options?.isQr
      ? 'QR_JOIN_SUCCESS'
      : options?.isRemote
      ? 'REMOTE_QUEUE_JOINED'
      : 'CUSTOMER_JOINED_QUEUE';

    await logAuditEvent({
      organizationId: queue.branch.organizationId,
      branchId: queue.branchId,
      userId,
      action: auditAction,
      details: { 
        ticketNumber, 
        queueId, 
        position: nextPosition, 
        priority: options?.priority || PriorityLevel.NORMAL,
        notificationPreference: options?.notificationPreference || NotificationPreference.STANDARD,
        source: resolvedSource,
        kioskId: options?.kioskId || null,
        isRemote: !!options?.isRemote, 
        isWalkIn: !!options?.isWalkIn,
        isQr: !!options?.isQr,
        qrId: options?.qrId || null,
      },
    });

    return { entry, ticketNumber, nextPosition, isExisting: false };
  });

  if ((result as any).isExisting) {
    return (result as any).entry;
  }

  const { entry, ticketNumber, nextPosition } = result as any;

  // 9. Real-time broadcast (Post-commit)
  if (io) {
    io.to(`queue_${queueId}`).emit('queue_updated', {
      type: 'USER_JOINED',
      entry,
    });
  }

  broadcastLobbyUpdate(entry.queue.branchId, 'TICKET_CREATED', {
    ticketNumber,
    entryId: entry.id,
    serviceName: entry.queue.service.name,
  }).catch(console.error);

  // Customer Notification
  notificationService.createNotification({
    userId,
    branchId: entry.queue.branchId,
    organizationId: entry.queue.branch.organizationId,
    type: 'QUEUE_JOINED',
    title: 'Queue Joined',
    message: `You have joined the ${entry.queue.service.name} queue. Your ticket number is ${ticketNumber}.`,
    priority: 'INFO',
    entityType: 'QUEUE_ENTRY',
    entityId: entry.id,
    metadata: {
      ticketId: entry.id,
      ticketNumber,
      queueId,
      position: nextPosition,
    },
  }).catch(console.error);

  // Staff Notification
  notificationService.createNotification({
    branchId: entry.queue.branchId,
    organizationId: entry.queue.branch.organizationId,
    type: 'STAFF_NEW_QUEUE_CUSTOMER',
    title: 'New Queue Customer',
    message: `A customer has joined the ${entry.queue.service.name} queue (Ticket ${ticketNumber}).`,
    priority: 'LOW',
    entityType: 'QUEUE_ENTRY',
    entityId: entry.id,
    metadata: {
      ticketId: entry.id,
      ticketNumber,
      serviceId: entry.queue.serviceId,
      serviceName: entry.queue.service.name,
    },
  }).catch(console.error);

  // Initialize callback according to customer preference (post-commit so foreign key constraint is satisfied)
  await callbackService.syncCallbackWithPreference(
    entry.id,
    options?.notificationPreference || NotificationPreference.STANDARD,
    userId,
    entry.queue.branch.organizationId,
    entry.queue.branchId
  ).catch((err) => {
    console.warn('[QueueService] Failed to sync callback preference on join:', err);
  });

  // Milestone proximity check for customer
  notifyQueueMilestones(queueId).catch(console.error);

  return entry;
};

/**
 * Call the next waiting customer.
 * State transition: WAITING -> CALLING
 */
export const callNext = async (
  queueId: string, 
  staffUserId?: string,
  options?: { counterNumber?: string }
) => {
  return await prisma.$transaction(async (tx) => {
    const queue = await tx.queue.findUnique({
      where: { id: queueId },
      include: { branch: true },
    });

    if (!queue) throw new Error('Queue not found');

    const priorityRatio = queue.priorityRatio || 2;
    const consecutivePriority = queue.consecutivePriorityCount || 0;

    let nextEntry: any = null;
    let chosenIsPriority = false;

    // Anti-starvation check: if consecutive priority customers reached ratio, serve next normal customer
    if (consecutivePriority >= priorityRatio) {
      const normalEntry = await tx.queueEntry.findFirst({
        where: { queueId, status: EntryStatus.WAITING, priority: PriorityLevel.NORMAL },
        orderBy: { position: 'asc' },
        include: { user: true },
      });
      if (normalEntry) {
        nextEntry = normalEntry;
        chosenIsPriority = false;
      }
    }

    // If no normal forced by anti-starvation, check for APPOINTMENT / PRIORITY customers
    if (!nextEntry) {
      const priorityEntry = await tx.queueEntry.findFirst({
        where: {
          queueId,
          status: EntryStatus.WAITING,
          priority: { in: [PriorityLevel.APPOINTMENT, PriorityLevel.PRIORITY] },
        },
        orderBy: [
          { priority: 'desc' },
          { position: 'asc' },
        ],
        include: { user: true },
      });

      if (priorityEntry) {
        nextEntry = priorityEntry;
        chosenIsPriority = true;
      } else {
        // Fallback to normal queue order
        nextEntry = await tx.queueEntry.findFirst({
          where: { queueId, status: EntryStatus.WAITING },
          orderBy: { position: 'asc' },
          include: { user: true },
        });
        chosenIsPriority = false;
      }
    }

    if (!nextEntry) return null;

    // Update queue consecutive priority counter if supported
    if (tx.queue && typeof (tx.queue as any).update === 'function') {
      await tx.queue.update({
        where: { id: queueId },
        data: {
          consecutivePriorityCount: chosenIsPriority ? consecutivePriority + 1 : 0,
        },
      });
    }

    const counterNumber = options?.counterNumber || null;

    if (counterNumber && tx.serviceCounter && typeof tx.serviceCounter.updateMany === 'function') {
      await tx.serviceCounter.updateMany({
        where: { branchId: queue.branchId, counterNumber },
        data: {
          status: 'SERVING',
          currentTicketNumber: nextEntry.ticketNumber,
          currentEntryId: nextEntry.id,
        },
      }).catch(() => null);
    }

    const updatedEntry = await tx.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: EntryStatus.CALLING,
        calledAt: new Date(),
        counterNumber: counterNumber || undefined,
        servedByStaffId: staffUserId || undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        queue: { include: { service: true } },
      },
    });

    await logAuditEvent({
      organizationId: queue.branch.organizationId,
      branchId: queue.branchId,
      userId: staffUserId,
      action: 'STAFF_CALLED_CUSTOMER',
      details: { entryId: updatedEntry.id, ticketNumber: updatedEntry.ticketNumber, counterNumber },
    });

    if (io) {
      // Broadcast to queue room
      const payload: any = {
        type: 'USER_CALLED',
        entry: updatedEntry,
      };
      if (counterNumber) {
        payload.counterNumber = counterNumber;
      }
      io.to(`queue_${queueId}`).emit('queue_updated', payload);

      // Broadcast to branch room for Lobby TV Displays
      if (queue.branchId) {
        io.to(`branch_${queue.branchId}`).emit('ticket_called', {
          entry: updatedEntry,
          ticketNumber: updatedEntry.ticketNumber,
          counterNumber: counterNumber || 'Counter Desk',
          serviceName: updatedEntry.queue?.service?.name,
          branchId: queue.branchId,
        });

        broadcastLobbyUpdate(queue.branchId, 'TICKET_CALLED', {
          ticketNumber: updatedEntry.ticketNumber,
          counterNumber: counterNumber || 'Counter Desk',
          serviceName: updatedEntry.queue?.service?.name,
        }).catch(console.error);
      }
    }

    // Customer Notification for ticket called
    const counterMsg = counterNumber 
      ? ` Please proceed immediately to ${counterNumber}.` 
      : ' Please proceed to the service counter.';

    await notificationService.createNotification({
      userId: updatedEntry.userId,
      branchId: queue.branchId,
      organizationId: queue.branch.organizationId,
      type: 'QUEUE_CALLED',
      title: 'Your Turn! 🔔',
      message: `Ticket ${updatedEntry.ticketNumber || '#' + updatedEntry.position} is now being called.${counterMsg}`,
      priority: 'URGENT',
      entityType: 'QUEUE_ENTRY',
      entityId: updatedEntry.id,
      metadata: {
        ticketId: updatedEntry.id,
        ticketNumber: updatedEntry.ticketNumber,
        counterNumber,
        queueId,
        serviceName: updatedEntry.queue?.service?.name,
      },
    });

    // Evaluate CALLED callback
    await callbackService.evaluateCallbacksForEntry({
      queueEntryId: updatedEntry.id,
      peopleAhead: 0,
      isCalled: true,
    });

    // Update proximity milestones for remaining waiting customers
    notifyQueueMilestones(queueId).catch(console.error);

    return updatedEntry;
  });
};

/**
 * Start serving a called customer.
 * State transition: CALLING -> SERVING
 */
export const startServing = async (
  entryId: string, 
  staffUserId?: string,
  options?: { counterNumber?: string }
) => {
  const existing = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!existing) throw new Error('Queue entry not found');

  if (existing.status !== EntryStatus.CALLING) {
    throw new Error(`Cannot start serving: current status is ${existing.status}, expected CALLING`);
  }

  const counterNumber = options?.counterNumber || existing.counterNumber || null;

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.SERVING,
      servingAt: new Date(),
      counterNumber: counterNumber || undefined,
      servedByStaffId: staffUserId || undefined,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      queue: { include: { service: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.queue.branch.organizationId,
    branchId: existing.queue.branchId,
    userId: staffUserId,
    action: 'STAFF_STARTED_SERVING',
    details: { entryId, ticketNumber: existing.ticketNumber, counterNumber },
  });

  if (io) {
    const payload: any = {
      type: 'USER_SERVING',
      entry: updatedEntry,
    };
    if (counterNumber) {
      payload.counterNumber = counterNumber;
    }
    io.to(`queue_${existing.queueId}`).emit('queue_updated', payload);

    broadcastLobbyUpdate(existing.queue.branchId, 'TICKET_SERVING', {
      ticketNumber: existing.ticketNumber,
      counterNumber: counterNumber || 'Counter Desk',
    }).catch(console.error);
  }

  await notificationService.createNotification({
    userId: updatedEntry.userId,
    branchId: existing.queue.branchId,
    organizationId: existing.queue.branch.organizationId,
    type: 'QUEUE_SERVING',
    title: 'Now Serving',
    message: `Staff has started serving your ticket ${existing.ticketNumber || '#' + existing.position}.`,
    priority: 'INFO',
    metadata: {
      ticketId: entryId,
      ticketNumber: existing.ticketNumber,
      queueId: existing.queueId,
    },
  });

  return updatedEntry;
};

/**
 * Complete service for a customer.
 * State transition: CALLING | SERVING -> COMPLETED
 */
export const completeEntry = async (entryId: string, staffUserId?: string) => {
  const existing = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!existing) throw new Error('Queue entry not found');

  if (existing.status !== EntryStatus.CALLING && existing.status !== EntryStatus.SERVING) {
    throw new Error(`Cannot complete service from status ${existing.status}`);
  }

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.COMPLETED,
      completedAt: new Date(),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.queue.branch.organizationId,
    branchId: existing.queue.branchId,
    userId: staffUserId,
    action: 'SERVICE_COMPLETED',
    details: { entryId, ticketNumber: existing.ticketNumber },
  });

  // Free assigned counter if applicable
  if (existing.counterNumber && prisma.serviceCounter && typeof prisma.serviceCounter.updateMany === 'function') {
    await prisma.serviceCounter.updateMany({
      where: { branchId: existing.queue.branchId, counterNumber: existing.counterNumber },
      data: {
        status: 'AVAILABLE',
        currentTicketNumber: null,
        currentEntryId: null,
      },
    }).catch(() => null);
  }

  if (io) {
    io.to(`queue_${existing.queueId}`).emit('queue_updated', {
      type: 'USER_COMPLETED',
      entryId,
      entry: updatedEntry,
    });

    broadcastLobbyUpdate(existing.queue.branchId, 'TICKET_COMPLETED', {
      ticketNumber: existing.ticketNumber,
    }).catch(console.error);
  }

  await notificationService.createNotification({
    userId: updatedEntry.userId,
    branchId: existing.queue.branchId,
    organizationId: existing.queue.branch.organizationId,
    type: 'QUEUE_COMPLETED',
    title: 'Service Completed',
    message: `Your service for ticket ${existing.ticketNumber || '#' + existing.position} is complete. Thank you for using QueueLess!`,
    priority: 'INFO',
    metadata: {
      ticketId: entryId,
      ticketNumber: existing.ticketNumber,
      queueId: existing.queueId,
    },
  });

  // Notify milestones for remaining customers
  notifyQueueMilestones(existing.queueId).catch(console.error);

  return updatedEntry;
};

/**
 * Skip a customer who is not at the counter.
 * State transition: CALLING -> SKIPPED
 */
export const skipEntry = async (entryId: string, staffUserId?: string) => {
  const existing = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!existing) throw new Error('Queue entry not found');

  if (existing.status !== EntryStatus.CALLING) {
    throw new Error(`Cannot skip customer: current status is ${existing.status}, expected CALLING`);
  }

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.SKIPPED,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.queue.branch.organizationId,
    branchId: existing.queue.branchId,
    userId: staffUserId,
    action: 'STAFF_SKIPPED_CUSTOMER',
    details: { entryId, ticketNumber: existing.ticketNumber },
  });

  // Free assigned counter if applicable
  if (existing.counterNumber && prisma.serviceCounter && typeof prisma.serviceCounter.updateMany === 'function') {
    await prisma.serviceCounter.updateMany({
      where: { branchId: existing.queue.branchId, counterNumber: existing.counterNumber },
      data: {
        status: 'AVAILABLE',
        currentTicketNumber: null,
        currentEntryId: null,
      },
    }).catch(() => null);
  }

  if (io) {
    io.to(`queue_${existing.queueId}`).emit('queue_updated', {
      type: 'USER_SKIPPED',
      entryId,
      entry: updatedEntry,
    });

    broadcastLobbyUpdate(existing.queue.branchId, 'TICKET_SKIPPED', {
      ticketNumber: existing.ticketNumber,
    }).catch(console.error);
  }

  notifyQueueMilestones(existing.queueId).catch(console.error);

  return updatedEntry;
};

/**
 * Cancel a queue ticket (voluntarily by customer or by branch staff with mandatory reason)
 * State transition: WAITING | CALLING -> CANCELLED
 */
export const cancelEntry = async (
  entryId: string,
  cancelledByUserId?: string,
  options?: {
    cancellationReason?: string;
    cancelledBy?: string;
  }
) => {
  const existing = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!existing) throw new Error('Queue entry not found');

  // Guard: Cannot cancel ticket if currently SERVING
  if (existing.status === EntryStatus.SERVING) {
    throw new Error('Ticket is currently in service at the counter and cannot be cancelled.');
  }

  if (existing.status === EntryStatus.COMPLETED || existing.status === EntryStatus.CANCELLED) {
    throw new Error(`Cannot cancel ticket with status ${existing.status}`);
  }

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: options?.cancellationReason || null,
      cancelledBy: options?.cancelledBy || null,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      queue: { include: { service: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.queue.branch.organizationId,
    branchId: existing.queue.branchId,
    userId: cancelledByUserId,
    action: 'TICKET_CANCELLED',
    details: { 
      entryId, 
      ticketNumber: existing.ticketNumber,
      cancellationReason: options?.cancellationReason || null,
      cancelledBy: options?.cancelledBy || null,
    },
  });

  if (io) {
    io.to(`queue_${existing.queueId}`).emit('queue_updated', {
      type: 'USER_CANCELLED',
      entryId,
      entry: updatedEntry,
      cancellationReason: options?.cancellationReason || null,
      cancelledBy: options?.cancelledBy || null,
    });
  }

  // Cancel active callbacks
  await callbackService.cancelActiveCallbacksForEntry(
    entryId,
    options?.cancellationReason || 'Ticket cancelled',
    cancelledByUserId
  );

  // Customer notification
  await notificationService.createNotification({
    userId: existing.userId,
    branchId: existing.queue.branchId,
    organizationId: existing.queue.branch.organizationId,
    type: 'QUEUE_CANCELLED',
    title: 'Ticket Cancelled',
    message: `Ticket ${existing.ticketNumber || '#' + existing.position} has been cancelled.${options?.cancellationReason ? ' Reason: ' + options.cancellationReason : ''}`,
    priority: 'IMPORTANT',
    entityType: 'QUEUE_ENTRY',
    entityId: entryId,
    metadata: {
      ticketId: entryId,
      ticketNumber: existing.ticketNumber,
      queueId: existing.queueId,
      cancellationReason: options?.cancellationReason || null,
      cancelledBy: options?.cancelledBy || null,
    },
  });

  // Staff notification
  await notificationService.createNotification({
    branchId: existing.queue.branchId,
    organizationId: existing.queue.branch.organizationId,
    type: 'STAFF_TICKET_CANCELLED',
    title: 'Customer Cancelled Ticket',
    message: `Ticket ${existing.ticketNumber || '#' + existing.position} was cancelled.${options?.cancellationReason ? ' Reason: ' + options.cancellationReason : ''}`,
    priority: 'IMPORTANT',
    entityType: 'QUEUE_ENTRY',
    entityId: entryId,
    metadata: {
      ticketId: entryId,
      ticketNumber: existing.ticketNumber,
      queueId: existing.queueId,
      cancelledBy: options?.cancelledBy || null,
    },
  });

  notifyQueueMilestones(existing.queueId).catch(console.error);

  return updatedEntry;
};

/**
 * Fetch detailed live status for staff or display board.
 * Returns current active line (WAITING, CALLING, SERVING) as well as today's completed, skipped, cancelled and transferred tickets.
 */
export const getLiveQueueStatus = async (queueId: string) => {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { serviceId: true, branchId: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.queueEntry.findMany({
    where: {
      OR: [
        { queueId, status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] } },
        { queueId, joinedAt: { gte: today } },
        ...(queue?.serviceId ? [{ originalServiceId: queue.serviceId, joinedAt: { gte: today } }] : []),
      ],
    },
    orderBy: { position: 'asc' },
    include: {
      user: { select: { id: true, fullName: true, profilePhoto: true, phoneNumber: true, email: true } },
      queue: { include: { service: true } },
    },
  });
};

/**
 * Recall a skipped customer back to the counter or waiting line.
 * State transition: SKIPPED -> CALLING or WAITING
 */
export const recallSkippedEntry = async (
  entryId: string,
  staffUserId?: string,
  options?: { action?: 'CALL' | 'RETURN_TO_WAITING'; counterNumber?: string }
) => {
  const existing = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!existing) throw new Error('Queue entry not found');
  if (existing.status !== EntryStatus.SKIPPED) {
    throw new Error(`Cannot recall ticket with status ${existing.status}. Expected SKIPPED.`);
  }

  const targetStatus = options?.action === 'RETURN_TO_WAITING' ? EntryStatus.WAITING : EntryStatus.CALLING;
  const counterNumber = options?.counterNumber || existing.counterNumber || null;

  const updatedEntry = await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      status: targetStatus,
      calledAt: targetStatus === EntryStatus.CALLING ? new Date() : existing.calledAt,
      counterNumber: targetStatus === EntryStatus.CALLING ? (counterNumber || undefined) : undefined,
      servedByStaffId: staffUserId || undefined,
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      queue: { include: { service: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.queue.branch.organizationId,
    branchId: existing.queue.branchId,
    userId: staffUserId,
    action: targetStatus === EntryStatus.CALLING ? 'STAFF_RECALLED_SKIPPED_CUSTOMER' : 'STAFF_RETURNED_SKIPPED_TO_WAITING',
    details: { entryId, ticketNumber: existing.ticketNumber, counterNumber },
  });

  if (io) {
    io.to(`queue_${existing.queueId}`).emit('queue_updated', {
      type: targetStatus === EntryStatus.CALLING ? 'USER_CALLED' : 'USER_JOINED',
      entry: updatedEntry,
    });
    if (existing.queue.branchId && targetStatus === EntryStatus.CALLING) {
      broadcastLobbyUpdate(existing.queue.branchId, 'TICKET_CALLED', {
        ticketNumber: existing.ticketNumber,
        counterNumber: counterNumber || 'Counter Desk',
        serviceName: updatedEntry.queue?.service?.name,
      }).catch(console.error);
    }
  }

  return updatedEntry;
};

/**
 * Get ticket status for a customer with position and waiting time estimation
 */
export const getCustomerTicketStatus = async (entryId: string) => {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: {
      queue: {
        include: {
          service: true,
          branch: { include: { organization: true } },
        },
      },
      user: { select: { fullName: true, email: true } },
    },
  });

  if (!entry) return null;

  // Smart queue position calculation server-side taking into account priority ordering
  let peopleAhead = 0;
  if (entry.status === EntryStatus.WAITING) {
    if (entry.priority === PriorityLevel.APPOINTMENT) {
      peopleAhead = await prisma.queueEntry.count({
        where: {
          queueId: entry.queueId,
          status: EntryStatus.WAITING,
          priority: PriorityLevel.APPOINTMENT,
          position: { lt: entry.position },
        },
      });
    } else if (entry.priority === PriorityLevel.PRIORITY) {
      peopleAhead = await prisma.queueEntry.count({
        where: {
          queueId: entry.queueId,
          status: EntryStatus.WAITING,
          OR: [
            { priority: PriorityLevel.APPOINTMENT },
            { priority: PriorityLevel.PRIORITY, position: { lt: entry.position } },
          ],
        },
      });
    } else {
      // NORMAL ticket
      peopleAhead = await prisma.queueEntry.count({
        where: {
          queueId: entry.queueId,
          status: EntryStatus.WAITING,
          OR: [
            { priority: { in: [PriorityLevel.APPOINTMENT, PriorityLevel.PRIORITY] } },
            { position: { lt: entry.position } },
          ],
        },
      });
    }
  }

  // Current serving entry
  const nowServing = await prisma.queueEntry.findFirst({
    where: {
      queueId: entry.queueId,
      status: { in: [EntryStatus.CALLING, EntryStatus.SERVING] },
    },
    orderBy: { position: 'asc' },
    select: { ticketNumber: true, status: true, position: true },
  });

  // Dynamic ETA calculation via etaService
  const etaCalculation = await calculateQueueEta(
    entry.queueId,
    peopleAhead,
    entry.status,
    entry.queue
  );

  const currentQueuePosition = entry.status === EntryStatus.WAITING ? peopleAhead + 1 : 1;

  // Resolve original service name if transferred
  let originalServiceName: string | null = null;
  if (entry.originalServiceId) {
    const origSvc = await prisma.service.findUnique({
      where: { id: entry.originalServiceId },
      select: { name: true },
    });
    originalServiceName = origSvc?.name || null;
  }

  return {
    entry,
    ticketNumber: entry.ticketNumber || `#${entry.position}`,
    serviceName: entry.queue.service.name,
    branchName: entry.queue.branch.name,
    branchLocation: entry.queue.branch.location,
    status: entry.status,
    position: currentQueuePosition,
    ticketSequencePosition: entry.position,
    priority: entry.priority,
    notificationPreference: entry.notificationPreference,
    customersAhead: peopleAhead,
    peopleAhead,
    nowServing,
    estimatedWaitTimeMinutes: etaCalculation.estimatedWaitTimeMinutes,
    dynamicPaceMinutes: etaCalculation.dynamicPaceMinutes,
    baselineDurationMinutes: etaCalculation.baselineDurationMinutes,
    recentAverageMinutes: etaCalculation.recentAverageMinutes,
    completedSampleCount: etaCalculation.completedSampleCount,
    isDynamic: etaCalculation.isDynamic,
    transferredFromEntryId: entry.transferredFromEntryId,
    originalServiceId: entry.originalServiceId,
    originalServiceName,
    transferredAt: entry.transferredAt,
    transferReason: entry.transferReason,
    cancellationReason: entry.cancellationReason,
    cancelledBy: entry.cancelledBy,
    cancelledAt: entry.cancelledAt,
    queueStatus: entry.queue.status,
    queueClosedReason: entry.queue.closedReason,
  };
};

/**
 * Get all active queue entries for a user across all queues
 */
export const getUserActiveTickets = async (userId: string) => {
  const activeEntries = await prisma.queueEntry.findMany({
    where: {
      userId,
      status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const statuses = await Promise.all(
    activeEntries.map((e) => getCustomerTicketStatus(e.id))
  );

  return statuses.filter((s): s is NonNullable<typeof s> => s !== null);
};

/**
 * Get user's active queue entry if any (enriched with all activeTickets)
 */
export const getUserActiveTicket = async (userId: string) => {
  const activeTickets = await getUserActiveTickets(userId);
  if (!activeTickets || activeTickets.length === 0) return null;

  return {
    ...activeTickets[0],
    activeTickets,
  };
};

/**
 * Get user's complete queue history (excluding customer-hidden items)
 */
export const getUserQueueHistory = async (userId: string) => {
  return await prisma.queueEntry.findMany({
    where: { 
      userId,
      isCustomerHidden: false,
    },
    include: {
      queue: {
        include: {
          service: true,
          branch: {
            include: { organization: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
};

/**
 * Remove/hide a queue ticket from customer's personal history view
 * Preserves backend authoritative record for auditing, security, and statistics.
 */
export const hideCustomerQueueEntry = async (entryId: string, userId: string) => {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  if (entry.userId !== userId) {
    throw new Error('Unauthorized: You can only remove your own history records');
  }

  return await prisma.queueEntry.update({
    where: { id: entryId },
    data: {
      isCustomerHidden: true,
      customerHiddenAt: new Date(),
    },
  });
};

/**
 * Update a service queue's OPEN/CLOSED status.
 * Only authorized staff/manager can toggle this.
 * Closing a queue stops accepting new customers while preserving existing tickets.
 */
export const updateQueueStatus = async (
  queueId: string,
  status: 'OPEN' | 'CLOSED',
  closedReason?: string,
  staffUserId?: string
) => {
  let effectiveReason = closedReason;
  let effectiveUserId = staffUserId;

  if (closedReason && !staffUserId) {
    if (status === 'OPEN' || closedReason.includes('staff') || closedReason.includes('user') || !closedReason.includes(' ')) {
      effectiveUserId = closedReason;
      effectiveReason = undefined;
    }
  }

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { service: true, branch: true },
  });

  if (!queue) {
    throw new Error('Queue not found');
  }

  const updatedQueue = await prisma.queue.update({
    where: { id: queueId },
    data: { 
      status,
      closedReason: status === 'CLOSED' ? (effectiveReason || 'Branch closing soon') : null,
      closedAt: status === 'CLOSED' ? new Date() : null,
      closedBy: status === 'CLOSED' ? (effectiveUserId || 'Staff') : null,
    },
    include: {
      service: true,
      branch: { select: { id: true, name: true, organizationId: true } },
      _count: {
        select: { entries: { where: { status: EntryStatus.WAITING } } },
      },
    },
  });

  await logAuditEvent({
    organizationId: queue.branch.organizationId,
    branchId: queue.branchId,
    userId: effectiveUserId,
    action: status === 'OPEN' ? 'SERVICE_QUEUE_OPENED' : 'SERVICE_QUEUE_CLOSED',
    details: {
      queueId: queue.id,
      serviceId: queue.serviceId,
      serviceName: queue.service.name,
      status,
      closedReason: updatedQueue.closedReason,
    },
  });

  if (io) {
    io.to(`queue_${queueId}`).emit('queue_status_changed', {
      queueId,
      status,
      serviceId: queue.serviceId,
      serviceName: queue.service.name,
      closedReason: updatedQueue.closedReason,
      closedAt: updatedQueue.closedAt,
    });
    io.to(`branch_${queue.branchId}`).emit('queue_status_changed', {
      queueId,
      status,
      serviceId: queue.serviceId,
      serviceName: queue.service.name,
      closedReason: updatedQueue.closedReason,
    });
  }

  return updatedQueue;
};

/**
 * Transfer a ticket to another service in the same branch.
 * Preserves original ticket identity, user, branch, and organization.
 */
export const transferTicket = async (
  entryId: string,
  destinationServiceId: string,
  staffUserId: string,
  options: {
    reason: string;
    reasonNote?: string;
  }
) => {
  return await prisma.$transaction(async (tx) => {
    const currentEntry = await tx.queueEntry.findUnique({
      where: { id: entryId },
      include: {
        queue: {
          include: {
            service: true,
            branch: { include: { organization: true } },
          },
        },
        user: true,
      },
    });

    if (!currentEntry) {
      throw new Error('Ticket not found');
    }

    if (currentEntry.status === EntryStatus.COMPLETED || currentEntry.status === EntryStatus.CANCELLED) {
      throw new Error(`Cannot transfer ticket with status ${currentEntry.status}`);
    }

    const sourceQueue = currentEntry.queue;
    const sourceService = sourceQueue.service;
    const branch = sourceQueue.branch;

    if (sourceService.id === destinationServiceId) {
      throw new Error('Ticket is already in this service queue');
    }

    const destinationService = await tx.service.findUnique({
      where: { id: destinationServiceId },
      include: {
        branch: { include: { organization: true } },
        queues: true,
      },
    });

    if (!destinationService) {
      throw new Error('Destination service not found');
    }

    // Security: Check tenant isolation
    if (destinationService.branch.organizationId !== branch.organizationId) {
      throw new Error('Security Error: Cross-organization service transfer is not permitted');
    }

    // Security: Check branch isolation
    if (destinationService.branchId !== branch.id) {
      throw new Error('Security Error: Cross-branch service transfer is not permitted');
    }

    // Service active and queue checks
    if (!destinationService.isActive) {
      throw new Error(`Destination service "${destinationService.name}" is currently inactive`);
    }

    const destinationQueue = destinationService.queues?.find((q) => q.status === 'OPEN') 
      || destinationService.queues?.[0];

    if (!destinationQueue) {
      throw new Error(`No active queue found for destination service "${destinationService.name}"`);
    }

    if (destinationQueue.status === 'CLOSED') {
      throw new Error(`Destination service queue "${destinationService.name}" is currently closed`);
    }

    const formattedReason = options.reasonNote 
      ? `${options.reason}: ${options.reasonNote}`
      : options.reason || 'Staff referral';

    // Compute last position in destination queue
    const lastDestEntry = await tx.queueEntry.findFirst({
      where: { queueId: destinationQueue.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = (lastDestEntry?.position || 0) + 1;

    // Update ticket with destination queue, preserving identity and logging transfer
    const updatedEntry = await tx.queueEntry.update({
      where: { id: entryId },
      data: {
        queueId: destinationQueue.id,
        position: nextPosition,
        status: EntryStatus.WAITING,
        originalServiceId: sourceService.id,
        transferredAt: new Date(),
        transferredByStaffId: staffUserId,
        transferReason: formattedReason,
        calledAt: null,
        servingAt: null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        queue: {
          include: {
            service: true,
            branch: { include: { organization: true } },
          },
        },
      },
    });

    await logAuditEvent({
      organizationId: branch.organizationId,
      branchId: branch.id,
      userId: staffUserId,
      action: 'TICKET_TRANSFERRED',
      details: {
        entryId,
        ticketNumber: currentEntry.ticketNumber,
        customerId: currentEntry.userId,
        fromServiceId: sourceService.id,
        fromServiceName: sourceService.name,
        toServiceId: destinationService.id,
        toServiceName: destinationService.name,
        fromQueueId: sourceQueue.id,
        toQueueId: destinationQueue.id,
        newPosition: nextPosition,
        reason: formattedReason,
      },
    });

    if (io) {
      io.to(`queue_${sourceQueue.id}`).emit('queue_updated', {
        type: 'USER_TRANSFERRED_OUT',
        entryId,
        ticketNumber: currentEntry.ticketNumber,
      });

      io.to(`queue_${destinationQueue.id}`).emit('queue_updated', {
        type: 'USER_TRANSFERRED_IN',
        entry: updatedEntry,
      });

      io.to(`user_${currentEntry.userId}`).emit('ticket_transferred', {
        entryId,
        ticketNumber: currentEntry.ticketNumber,
        oldServiceName: sourceService.name,
        newServiceName: destinationService.name,
        newPosition: nextPosition,
        reason: formattedReason,
      });

      broadcastLobbyUpdate(branch.id, 'TICKET_TRANSFERRED', {
        ticketNumber: currentEntry.ticketNumber,
        oldServiceName: sourceService.name,
        newServiceName: destinationService.name,
      }).catch(console.error);
    }

    // Customer Notification
    await notificationService.createNotification({
      userId: currentEntry.userId,
      branchId: branch.id,
      organizationId: branch.organizationId,
      type: 'QUEUE_TRANSFERRED',
      title: 'Service Queue Transferred',
      message: `Your service has been changed from ${sourceService.name} to ${destinationService.name}.${formattedReason ? ` Reason: ${formattedReason}` : ''}`,
      priority: 'IMPORTANT',
      entityType: 'QUEUE_ENTRY',
      entityId: entryId,
      metadata: {
        ticketId: entryId,
        ticketNumber: currentEntry.ticketNumber,
        oldServiceId: sourceService.id,
        oldServiceName: sourceService.name,
        newServiceId: destinationService.id,
        newServiceName: destinationService.name,
        newPosition: nextPosition,
        reason: formattedReason,
      },
    });

    // Staff Notification for transferred-in customer
    await notificationService.createNotification({
      branchId: branch.id,
      organizationId: branch.organizationId,
      type: 'STAFF_CUSTOMER_TRANSFERRED',
      title: 'Customer Transferred to Service',
      message: `Ticket ${currentEntry.ticketNumber || '#' + nextPosition} transferred to ${destinationService.name}.${formattedReason ? ` Reason: ${formattedReason}` : ''}`,
      priority: 'IMPORTANT',
      entityType: 'QUEUE_ENTRY',
      entityId: entryId,
      metadata: {
        ticketId: entryId,
        ticketNumber: currentEntry.ticketNumber,
        destinationServiceId: destinationService.id,
        destinationServiceName: destinationService.name,
      },
    });

    notifyQueueMilestones(sourceQueue.id).catch(console.error);
    notifyQueueMilestones(destinationQueue.id).catch(console.error);

    return updatedEntry;
  });
};

/**
 * Assign or update a ticket's priority level.
 */
export const updateTicketPriority = async (
  entryId: string,
  priority: PriorityLevel,
  staffUserId: string,
  reason?: string
) => {
  const current = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!current) throw new Error('Queue entry not found');

  const oldPriority = current.priority;

  const updated = await prisma.queueEntry.update({
    where: { id: entryId },
    data: { priority },
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      queue: { include: { service: true } },
    },
  });

  await logAuditEvent({
    organizationId: current.queue.branch.organizationId,
    branchId: current.queue.branchId,
    userId: staffUserId,
    action: 'TICKET_PRIORITY_CHANGED',
    details: {
      entryId,
      ticketNumber: current.ticketNumber,
      oldPriority,
      newPriority: priority,
      reason: reason || 'Staff adjustment',
    },
  });

  if (io) {
    io.to(`queue_${current.queueId}`).emit('queue_updated', {
      type: 'PRIORITY_CHANGED',
      entryId,
      priority,
    });
  }

  notifyQueueMilestones(current.queueId).catch(console.error);

  return updated;
};

/**
 * Update a customer's callback/notification preference for an active ticket.
 */
export const updateNotificationPreference = async (
  entryId: string,
  userId: string,
  preference: NotificationPreference
) => {
  const current = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { queue: { include: { branch: true } } },
  });

  if (!current) throw new Error('Queue entry not found');
  if (current.userId !== userId) {
    throw new Error('Unauthorized: You can only modify notification preferences for your own tickets');
  }

  const updated = await prisma.queueEntry.update({
    where: { id: entryId },
    data: { notificationPreference: preference },
  });

  await callbackService.syncCallbackWithPreference(
    entryId,
    preference,
    userId,
    current.queue.branch.organizationId,
    current.queue.branchId
  );

  await logAuditEvent({
    organizationId: current.queue.branch.organizationId,
    branchId: current.queue.branchId,
    userId,
    action: 'NOTIFICATION_PREFERENCE_UPDATED',
    details: {
      entryId,
      ticketNumber: current.ticketNumber,
      preference,
    },
  });

  return updated;
};

/**
 * Retrieve queue operating policy
 */
export const getQueuePolicy = async (queueId: string) => {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      service: true,
      branch: { include: { organization: true } },
    },
  });

  if (!queue) throw new Error('Queue not found');

  return {
    queueId: queue.id,
    serviceId: queue.serviceId,
    serviceName: queue.service.name,
    branchId: queue.branchId,
    branchName: queue.branch.name,
    status: queue.status,
    closedReason: queue.closedReason,
    capacity: queue.capacity || queue.service.capacity,
    servingCapacity: queue.servingCapacity || queue.service.servingCapacity || 1,
    priorityRatio: queue.priorityRatio,
    consecutivePriorityCount: queue.consecutivePriorityCount,
    allowRemoteJoin: queue.service.allowRemoteJoin,
    allowQrJoin: queue.service.allowQrJoin,
    allowWalkIn: queue.service.allowWalkIn,
    allowAppointments: queue.service.allowAppointments,
    priorityEnabled: queue.service.priorityEnabled,
    estimatedDuration: queue.service.duration,
  };
};

/**
 * Update queue operating policy
 */
export const updateQueuePolicy = async (
  queueId: string,
  policyData: {
    capacity?: number | null;
    servingCapacity?: number;
    priorityRatio?: number;
    allowRemoteJoin?: boolean;
    allowQrJoin?: boolean;
    allowWalkIn?: boolean;
    allowAppointments?: boolean;
    priorityEnabled?: boolean;
    estimatedDuration?: number;
  },
  staffUserId?: string
) => {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { service: true, branch: true },
  });

  if (!queue) throw new Error('Queue not found');

  return await prisma.$transaction(async (tx) => {
    const updatedQueue = await tx.queue.update({
      where: { id: queueId },
      data: {
        capacity: policyData.capacity !== undefined ? policyData.capacity : undefined,
        servingCapacity: policyData.servingCapacity !== undefined ? policyData.servingCapacity : undefined,
        priorityRatio: policyData.priorityRatio !== undefined ? policyData.priorityRatio : undefined,
      },
    });

    const updatedService = await tx.service.update({
      where: { id: queue.serviceId },
      data: {
        capacity: policyData.capacity !== undefined ? policyData.capacity : undefined,
        servingCapacity: policyData.servingCapacity !== undefined ? policyData.servingCapacity : undefined,
        allowRemoteJoin: policyData.allowRemoteJoin !== undefined ? policyData.allowRemoteJoin : undefined,
        allowQrJoin: policyData.allowQrJoin !== undefined ? policyData.allowQrJoin : undefined,
        allowWalkIn: policyData.allowWalkIn !== undefined ? policyData.allowWalkIn : undefined,
        allowAppointments: policyData.allowAppointments !== undefined ? policyData.allowAppointments : undefined,
        priorityEnabled: policyData.priorityEnabled !== undefined ? policyData.priorityEnabled : undefined,
        duration: policyData.estimatedDuration !== undefined ? policyData.estimatedDuration : undefined,
      },
    });

    await logAuditEvent({
      organizationId: queue.branch.organizationId,
      branchId: queue.branchId,
      userId: staffUserId,
      action: 'QUEUE_POLICY_UPDATED',
      details: {
        queueId,
        serviceId: queue.serviceId,
        policyUpdates: policyData,
      },
    });

    if (io) {
      io.to(`queue_${queueId}`).emit('queue_policy_updated', {
        queueId,
        policy: policyData,
      });
    }

    return {
      queue: updatedQueue,
      service: updatedService,
    };
  });
};



