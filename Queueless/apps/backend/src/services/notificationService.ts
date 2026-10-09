import prisma from '../config/prisma';
import { io } from '../index';
import {
  NotificationPriority,
  DeliveryChannel,
} from '@prisma/client';
import channelDispatcher, {
  NotificationPayload,
  sendExpoPushNotification,
  sendSmsAlert,
} from './channelDispatcher';

export { sendExpoPushNotification, sendSmsAlert };

export interface CreateNotificationParams {
  userId?: string | null;
  organizationId?: string | null;
  branchId?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
  priority?: NotificationPriority | 'INFO' | 'ACTION_REQUIRED' | 'IMPORTANT' | 'URGENT' | 'NORMAL' | 'LOW' | string;
  entityType?: string | null;
  entityId?: string | null;
  expiresAt?: Date | null;
  channels?: DeliveryChannel[];
}

/**
 * Normalizes legacy string priorities into NotificationPriority enum
 */
export function normalizeNotificationPriority(
  priority?: string | NotificationPriority
): NotificationPriority {
  if (!priority) return NotificationPriority.NORMAL;
  const p = String(priority).toUpperCase();
  if (p === 'URGENT') return NotificationPriority.URGENT;
  if (p === 'IMPORTANT' || p === 'ACTION_REQUIRED') return NotificationPriority.IMPORTANT;
  if (p === 'LOW') return NotificationPriority.LOW;
  return NotificationPriority.NORMAL;
}

/**
 * Unified notification creation method.
 * Persists to database, dispatches across active channels, and logs delivery.
 */
export const createNotification = async (params: CreateNotificationParams) => {
  const priority = normalizeNotificationPriority(params.priority);

  if (!prisma.notification || typeof prisma.notification.create !== 'function') {
    return {
      id: 'mock-notif-' + Date.now(),
      ...params,
      priority,
      isRead: false,
      createdAt: new Date(),
    } as any;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId || null,
      organizationId: params.organizationId || null,
      branchId: params.branchId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata ? (params.metadata as any) : undefined,
      priority,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      expiresAt: params.expiresAt || null,
      isRead: false,
    },
  });

  // Collect recipient details for multi-device & multi-channel delivery
  const recipientInfo: {
    pushTokens: string[];
    phoneNumber?: string | null;
    email?: string | null;
  } = { pushTokens: [] };

  if (params.userId && prisma.user && typeof prisma.user.findUnique === 'function') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { pushToken: true, phoneNumber: true, email: true },
      });
      if (user?.pushToken) recipientInfo.pushTokens.push(user.pushToken);
      recipientInfo.phoneNumber = user?.phoneNumber;
      recipientInfo.email = user?.email;

      if (prisma.userDevice && typeof prisma.userDevice.findMany === 'function') {
        const devices = await prisma.userDevice.findMany({
          where: { userId: params.userId },
          select: { token: true },
        });
        for (const d of devices) {
          if (d.token && !recipientInfo.pushTokens.includes(d.token)) {
            recipientInfo.pushTokens.push(d.token);
          }
        }
      }
    } catch {
      // Safe fallback for mocked test environments
    }
  }

  // Determine channels to dispatch
  const selectedChannels: DeliveryChannel[] = params.channels || [
    DeliveryChannel.IN_APP,
    DeliveryChannel.PUSH,
  ];

  if (
    priority === NotificationPriority.URGENT &&
    recipientInfo.phoneNumber &&
    !selectedChannels.includes(DeliveryChannel.SMS)
  ) {
    selectedChannels.push(DeliveryChannel.SMS);
  }

  // Dispatch asynchronously
  const payload: NotificationPayload = {
    id: notification.id,
    userId: notification.userId,
    organizationId: notification.organizationId,
    branchId: notification.branchId,
    title: notification.title,
    message: notification.message,
    priority,
    type: notification.type,
    metadata: params.metadata || null,
    entityType: notification.entityType,
    entityId: notification.entityId,
  };

  channelDispatcher.dispatch(payload, selectedChannels, recipientInfo).catch((err) => {
    console.warn('[NotificationService] Channel dispatch failure:', err.message);
  });

  return notification;
};

/**
 * Checks if a specific queue milestone notification has already been created
 * for this customer ticket, to prevent duplicate notifications upon refresh or multiple calls.
 */
export const hasMilestoneBeenNotified = async (
  userId: string,
  ticketId: string,
  milestoneType: string
): Promise<boolean> => {
  if (!prisma.notification || typeof prisma.notification.findMany !== 'function') {
    return false;
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      type: milestoneType,
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  return notifications.some((n) => {
    try {
      const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
      return (meta as any)?.ticketId === ticketId;
    } catch {
      return false;
    }
  });
};

/**
 * Self-healing utility for legacy or raw MariaDB rows with empty string priority
 */
export const ensureValidNotificationPriorities = async () => {
  if (!prisma || typeof (prisma as any).$executeRawUnsafe !== 'function') return;
  const tableNames = ['notification', 'Notification', 'notifications', 'Notifications'];
  for (const tbl of tableNames) {
    try {
      await (prisma as any).$executeRawUnsafe(
        `UPDATE \`${tbl}\` SET \`priority\` = 'NORMAL' WHERE \`priority\` = '' OR \`priority\` IS NULL OR \`priority\` = '0' OR \`priority\` + 0 = 0 OR \`priority\` NOT IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT')`
      );
    } catch {
      // Table variation doesn't exist, continue
    }
  }
};

// Run healing in background on module load
ensureValidNotificationPriorities().catch(() => {});

/**
 * Retrieve notifications for a customer
 */
export const getUserNotifications = async (
  userId: string,
  options?: { limit?: number; offset?: number; isRead?: boolean; priority?: NotificationPriority }
) => {
  if (!prisma.notification || typeof prisma.notification.findMany !== 'function') {
    return { notifications: [], total: 0 };
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where: any = { userId };
  if (options?.isRead !== undefined) {
    where.isRead = options.isRead;
  }
  if (options?.priority) {
    where.priority = options.priority;
  }

  let notifications: any[] = [];
  let total = 0;

  try {
    [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);
  } catch (error: any) {
    console.warn('[NotificationService] findMany error in getUserNotifications, attempting recovery:', error?.message);
    await ensureValidNotificationPriorities();
    try {
      [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({ where }),
      ]);
    } catch (retryError: any) {
      console.warn('[NotificationService] findMany retry failed, using safe fallback:', retryError?.message);
      try {
        const rawRows: any[] = await (prisma as any).$queryRawUnsafe(`
          SELECT id, userId, organizationId, branchId, type, title, message, metadata,
            CASE WHEN priority IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT') THEN priority ELSE 'NORMAL' END AS priority,
            entityType, entityId, isRead, readAt, expiresAt, createdAt, updatedAt
          FROM \`notification\`
          WHERE \`userId\` = ?
          ORDER BY \`createdAt\` DESC
          LIMIT ? OFFSET ?
        `, userId, limit, offset).catch(() =>
          (prisma as any).$queryRawUnsafe(`
            SELECT id, userId, organizationId, branchId, type, title, message, metadata,
              CASE WHEN priority IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT') THEN priority ELSE 'NORMAL' END AS priority,
              entityType, entityId, isRead, readAt, expiresAt, createdAt, updatedAt
            FROM \`Notification\`
            WHERE \`userId\` = ?
            ORDER BY \`createdAt\` DESC
            LIMIT ? OFFSET ?
          `, userId, limit, offset)
        );
        notifications = rawRows || [];
        total = notifications.length;
      } catch (rawErr) {
        console.error('[NotificationService] Raw query fallback failed:', rawErr);
        notifications = [];
        total = 0;
      }
    }
  }

  return {
    notifications: notifications.map((n) => ({
      ...n,
      metadata: n.metadata ? safeParseJson(n.metadata as string) : null,
    })),
    total,
  };
};

/**
 * Retrieve notifications for branch staff
 */
export const getBranchStaffNotifications = async (
  branchId: string,
  options?: { limit?: number; offset?: number; isRead?: boolean; priority?: NotificationPriority }
) => {
  if (!prisma.notification || typeof prisma.notification.findMany !== 'function') {
    return { notifications: [], total: 0 };
  }

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where: any = { branchId };
  if (options?.isRead !== undefined) {
    where.isRead = options.isRead;
  }
  if (options?.priority) {
    where.priority = options.priority;
  }

  let notifications: any[] = [];
  let total = 0;

  try {
    [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);
  } catch (error: any) {
    console.warn('[NotificationService] findMany error in getBranchStaffNotifications, attempting recovery:', error?.message);
    await ensureValidNotificationPriorities();
    try {
      [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({ where }),
      ]);
    } catch (retryError: any) {
      console.warn('[NotificationService] getBranchStaffNotifications retry failed, using safe fallback:', retryError?.message);
      try {
        const rawRows: any[] = await (prisma as any).$queryRawUnsafe(`
          SELECT id, userId, organizationId, branchId, type, title, message, metadata,
            CASE WHEN priority IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT') THEN priority ELSE 'NORMAL' END AS priority,
            entityType, entityId, isRead, readAt, expiresAt, createdAt, updatedAt
          FROM \`notification\`
          WHERE \`branchId\` = ?
          ORDER BY \`createdAt\` DESC
          LIMIT ? OFFSET ?
        `, branchId, limit, offset).catch(() =>
          (prisma as any).$queryRawUnsafe(`
            SELECT id, userId, organizationId, branchId, type, title, message, metadata,
              CASE WHEN priority IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT') THEN priority ELSE 'NORMAL' END AS priority,
              entityType, entityId, isRead, readAt, expiresAt, createdAt, updatedAt
            FROM \`Notification\`
            WHERE \`branchId\` = ?
            ORDER BY \`createdAt\` DESC
            LIMIT ? OFFSET ?
          `, branchId, limit, offset)
        );
        notifications = rawRows || [];
        total = notifications.length;
      } catch (rawErr) {
        console.error('[NotificationService] Raw query fallback failed:', rawErr);
        notifications = [];
        total = 0;
      }
    }
  }

  return {
    notifications: notifications.map((n) => ({
      ...n,
      metadata: n.metadata ? safeParseJson(n.metadata as string) : null,
    })),
    total,
  };
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (id: string, userId?: string) => {
  if (!prisma.notification || typeof prisma.notification.update !== 'function') {
    return null as any;
  }

  const where: any = { id };
  if (userId) {
    where.userId = userId;
  }

  return await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/**
 * Mark all notifications as read for a user or branch
 */
export const markAllAsRead = async (target: { userId?: string; branchId?: string }) => {
  if (!prisma.notification || typeof prisma.notification.updateMany !== 'function') {
    return { count: 0 };
  }

  const where: any = { isRead: false };
  if (target.userId) {
    where.userId = target.userId;
  } else if (target.branchId) {
    where.branchId = target.branchId;
  } else {
    return { count: 0 };
  }

  return await prisma.notification.updateMany({
    where,
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (target: { userId?: string; branchId?: string }) => {
  if (!prisma.notification || typeof prisma.notification.count !== 'function') {
    return 0;
  }

  const where: any = { isRead: false };
  if (target.userId) {
    where.userId = target.userId;
  } else if (target.branchId) {
    where.branchId = target.branchId;
  } else {
    return 0;
  }

  return await prisma.notification.count({ where });
};

/**
 * Device Token Management (Part 16)
 * Supports multiple devices per customer and clean unregistration on logout.
 */
export const registerUserDevice = async (
  userId: string,
  token: string,
  platform: string = 'EXPO'
) => {
  if (!token || !userId) return null;

  // Update primary pushToken on user record for backward compatibility
  await prisma.user.update({
    where: { id: userId },
    data: { pushToken: token },
  }).catch(() => null);

  // Upsert device record
  return await prisma.userDevice.upsert({
    where: {
      userId_token: { userId, token },
    },
    update: {
      platform,
      lastUsedAt: new Date(),
    },
    create: {
      userId,
      token,
      platform,
      lastUsedAt: new Date(),
    },
  });
};

export const removeUserDevice = async (userId: string, token: string) => {
  try {
    return await prisma.userDevice.delete({
      where: {
        userId_token: { userId, token },
      },
    });
  } catch {
    return null;
  }
};

export const getUserDevices = async (userId: string) => {
  return await prisma.userDevice.findMany({
    where: { userId },
    orderBy: { lastUsedAt: 'desc' },
  });
};

function safeParseJson(val: any): any {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}
