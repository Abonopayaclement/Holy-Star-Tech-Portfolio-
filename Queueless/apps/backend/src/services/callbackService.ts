import prisma from '../config/prisma';
import {
  CallbackThreshold,
  CallbackChannel,
  CallbackStatus,
  NotificationPreference,
  NotificationPriority,
} from '@prisma/client';
import { createNotification } from './notificationService';
import { logAuditEvent } from '../utils/audit';

export interface CreateCallbackRequestParams {
  organizationId: string;
  branchId: string;
  userId: string;
  queueEntryId: string;
  threshold: CallbackThreshold;
  channel?: CallbackChannel;
}

/**
 * Creates or updates an active callback request for a customer queue entry
 */
export const registerCallbackRequest = async (params: CreateCallbackRequestParams) => {
  if (!prisma.callbackRequest || typeof prisma.callbackRequest.create !== 'function') {
    return null as any;
  }

  const channel = params.channel || CallbackChannel.IN_APP_NOTIFICATION;

  // First cancel any existing ACTIVE callback for this entry that has a DIFFERENT threshold
  await cancelActiveCallbacksForEntry(
    params.queueEntryId,
    `Updated preference to ${params.threshold}`,
    params.userId
  );

  // Validate that queue entry exists to prevent foreign key constraint errors
  const entryExists = await prisma.queueEntry.findUnique({
    where: { id: params.queueEntryId },
    select: { id: true },
  });

  if (!entryExists) {
    console.warn(`[CallbackService] Queue entry ${params.queueEntryId} not found, skipping callback request creation.`);
    return null as any;
  }

  const callback = await prisma.callbackRequest.create({
    data: {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      queueEntryId: params.queueEntryId,
      threshold: params.threshold,
      channel,
      status: CallbackStatus.ACTIVE,
    },
    include: {
      queueEntry: {
        include: {
          queue: {
            include: {
              service: true,
              branch: true,
            },
          },
        },
      },
    },
  });

  await logAuditEvent({
    organizationId: params.organizationId,
    branchId: params.branchId,
    userId: params.userId,
    action: 'CALLBACK_CREATED',
    details: {
      callbackId: callback.id,
      queueEntryId: params.queueEntryId,
      threshold: params.threshold,
      channel,
    },
  });

  return callback;
};

/**
 * Cancels active callbacks when customer changes preferences or cancels ticket (Part 9)
 */
export const cancelActiveCallbacksForEntry = async (
  queueEntryId: string,
  reason: string = 'Preference updated or ticket left',
  userId?: string
) => {
  if (!prisma.callbackRequest || typeof prisma.callbackRequest.findMany !== 'function') {
    return { count: 0 };
  }

  const activeCallbacks = await prisma.callbackRequest.findMany({
    where: {
      queueEntryId,
      status: { in: [CallbackStatus.ACTIVE, CallbackStatus.TRIGGERED] },
    },
  });

  if (activeCallbacks.length === 0) return { count: 0 };

  const updated = await prisma.callbackRequest.updateMany({
    where: {
      queueEntryId,
      status: { in: [CallbackStatus.ACTIVE, CallbackStatus.TRIGGERED] },
    },
    data: {
      status: CallbackStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });

  for (const cb of activeCallbacks) {
    await logAuditEvent({
      organizationId: cb.organizationId,
      branchId: cb.branchId,
      userId: userId || cb.userId,
      action: 'CALLBACK_CANCELLED',
      details: {
        callbackId: cb.id,
        queueEntryId,
        threshold: cb.threshold,
        reason,
      },
    });
  }

  return updated;
};

/**
 * Sync callback requests with updated notification preference
 */
export const syncCallbackWithPreference = async (
  queueEntryId: string,
  newPreference: NotificationPreference,
  userId: string,
  organizationId: string,
  branchId: string
) => {
  if (newPreference === NotificationPreference.NOTIFY_CALLED_ONLY) {
    // Only register CALLED callback
    return await registerCallbackRequest({
      organizationId,
      branchId,
      userId,
      queueEntryId,
      threshold: CallbackThreshold.CALLED,
    });
  } else if (newPreference === NotificationPreference.NOTIFY_APPROACHING_2) {
    return await registerCallbackRequest({
      organizationId,
      branchId,
      userId,
      queueEntryId,
      threshold: CallbackThreshold.APPROACHING_2,
    });
  } else if (newPreference === NotificationPreference.NOTIFY_APPROACHING_5) {
    return await registerCallbackRequest({
      organizationId,
      branchId,
      userId,
      queueEntryId,
      threshold: CallbackThreshold.APPROACHING_5,
    });
  } else {
    // Standard preference: default approaching 5 callback
    return await registerCallbackRequest({
      organizationId,
      branchId,
      userId,
      queueEntryId,
      threshold: CallbackThreshold.APPROACHING_5,
    });
  }
};

/**
 * Authoritative evaluation of active callbacks during queue position shifts
 */
export const evaluateCallbacksForEntry = async (params: {
  queueEntryId: string;
  peopleAhead: number;
  isCalled?: boolean;
}) => {
  if (!prisma.callbackRequest || typeof prisma.callbackRequest.findMany !== 'function') {
    return [];
  }

  const { queueEntryId, peopleAhead, isCalled } = params;

  const activeCallbacks = await prisma.callbackRequest.findMany({
    where: {
      queueEntryId,
      status: CallbackStatus.ACTIVE,
    },
    include: {
      queueEntry: {
        include: {
          queue: {
            include: {
              service: true,
              branch: true,
            },
          },
        },
      },
    },
  });

  if (activeCallbacks.length === 0) return [];

  const triggeredResults = [];

  for (const cb of activeCallbacks) {
    let shouldTrigger = false;

    if (isCalled && cb.threshold === CallbackThreshold.CALLED) {
      shouldTrigger = true;
    } else if (!isCalled) {
      if (cb.threshold === CallbackThreshold.APPROACHING_2 && peopleAhead <= 2) {
        shouldTrigger = true;
      } else if (cb.threshold === CallbackThreshold.APPROACHING_5 && peopleAhead <= 5) {
        shouldTrigger = true;
      }
    }

    if (shouldTrigger) {
      // Mark as TRIGGERED
      const updated = await prisma.callbackRequest.update({
        where: { id: cb.id },
        data: {
          status: CallbackStatus.TRIGGERED,
          triggeredAt: new Date(),
        },
      });

      const entry = cb.queueEntry;
      const serviceName = entry?.queue?.service?.name || 'Service';
      const ticketNum = entry?.ticketNumber || `#${entry?.position}`;

      const title = isCalled ? 'You are being called!' : 'Queue Alert: Your turn is approaching';
      const message = isCalled
        ? `Ticket ${ticketNum} is now being called for ${serviceName}. Please proceed to the service counter.`
        : `You have approximately ${peopleAhead} ${peopleAhead === 1 ? 'customer' : 'customers'} ahead of you for ticket ${ticketNum} (${serviceName}).`;

      await createNotification({
        userId: cb.userId,
        branchId: cb.branchId,
        organizationId: cb.organizationId,
        type: isCalled ? 'QUEUE_CALLED' : `QUEUE_APPROACHING_${cb.threshold === CallbackThreshold.APPROACHING_2 ? '2' : '5'}`,
        title,
        message,
        priority: isCalled ? NotificationPriority.URGENT : NotificationPriority.IMPORTANT,
        entityType: 'QUEUE',
        entityId: cb.queueEntryId,
        metadata: {
          callbackId: cb.id,
          ticketId: cb.queueEntryId,
          ticketNumber: ticketNum,
          peopleAhead,
          threshold: cb.threshold,
        },
      });

      await logAuditEvent({
        organizationId: cb.organizationId,
        branchId: cb.branchId,
        userId: cb.userId,
        action: 'CALLBACK_TRIGGERED',
        details: {
          callbackId: cb.id,
          queueEntryId: cb.queueEntryId,
          threshold: cb.threshold,
          peopleAhead,
        },
      });

      triggeredResults.push(updated);
    }
  }

  return triggeredResults;
};

/**
 * Acknowledge callback when customer opens or views the alert (Part 7)
 */
export const acknowledgeCallback = async (callbackId: string, userId: string) => {
  if (!prisma.callbackRequest || typeof prisma.callbackRequest.findUnique !== 'function') {
    return null as any;
  }

  const cb = await prisma.callbackRequest.findUnique({
    where: { id: callbackId },
  });

  if (!cb) throw new Error('Callback request not found');
  if (cb.userId !== userId) throw new Error('Unauthorized callback access');

  return await prisma.callbackRequest.update({
    where: { id: callbackId },
    data: {
      status: CallbackStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
    },
  });
};

/**
 * Get active callback for a queue entry
 */
export const getActiveCallbackForEntry = async (queueEntryId: string, userId: string) => {
  if (!prisma.callbackRequest || typeof prisma.callbackRequest.findFirst !== 'function') {
    return null;
  }

  return await prisma.callbackRequest.findFirst({
    where: {
      queueEntryId,
      userId,
      status: {
        in: [CallbackStatus.ACTIVE, CallbackStatus.TRIGGERED],
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Cancel a specific callback request by customer
 */
export const cancelCallback = async (callbackId: string, reason: string = 'Cancelled by user', userId: string) => {
  if (!prisma.callbackRequest || typeof prisma.callbackRequest.findUnique !== 'function') {
    return null as any;
  }

  const cb = await prisma.callbackRequest.findUnique({
    where: { id: callbackId },
  });

  if (!cb) throw new Error('Callback request not found');
  if (cb.userId !== userId) throw new Error('Unauthorized callback access');

  return await prisma.callbackRequest.update({
    where: { id: callbackId },
    data: {
      status: CallbackStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });
};

