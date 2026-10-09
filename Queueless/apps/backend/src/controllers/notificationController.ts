import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import prisma from '../config/prisma';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const scope = (req.query.scope as string) || 'user';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

    if (scope === 'branch') {
      // Find user's branch
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { staffBranchId: true, managedBranches: { select: { id: true } } },
      });
      const branchId = dbUser?.staffBranchId || dbUser?.managedBranches?.[0]?.id || (req.query.branchId as string);

      if (!branchId) {
        return res.json({ notifications: [], total: 0 });
      }

      const result = await notificationService.getBranchStaffNotifications(branchId, {
        limit,
        offset,
        isRead,
      });
      return res.json(result);
    }

    const result = await notificationService.getUserNotifications(user.id, {
      limit,
      offset,
      isRead,
    });
    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const scope = (req.query.scope as string) || 'user';
    if (scope === 'branch') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { staffBranchId: true, managedBranches: { select: { id: true } } },
      });
      const branchId = dbUser?.staffBranchId || dbUser?.managedBranches?.[0]?.id || (req.query.branchId as string);

      if (!branchId) {
        return res.json({ count: 0 });
      }

      const count = await notificationService.getUnreadCount({ branchId });
      return res.json({ count });
    }

    const count = await notificationService.getUnreadCount({ userId: user.id });
    return res.json({ count });
  } catch (error: any) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({ error: 'Failed to get unread notification count' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updated = await notificationService.markAsRead(id as string);
    return res.json(updated);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const scope = (req.query.scope as string) || 'user';
    if (scope === 'branch') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { staffBranchId: true, managedBranches: { select: { id: true } } },
      });
      const branchId = dbUser?.staffBranchId || dbUser?.managedBranches?.[0]?.id || (req.query.branchId as string);

      if (branchId) {
        await notificationService.markAllAsRead({ branchId });
      }
      return res.json({ success: true });
    }

    await notificationService.markAllAsRead({ userId: user.id });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const registerDevice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { deviceToken, platform } = req.body;
    if (!deviceToken) {
      return res.status(400).json({ error: 'deviceToken is required' });
    }

    const device = await notificationService.registerUserDevice(
      user.id,
      deviceToken,
      platform
    );

    return res.status(201).json(device);
  } catch (error: any) {
    console.error('Error registering device token:', error);
    return res.status(500).json({ error: 'Failed to register device token' });
  }
};

export const removeDevice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { deviceToken } = req.params;
    if (!deviceToken) {
      return res.status(400).json({ error: 'deviceToken is required' });
    }

    await notificationService.removeUserDevice(user.id, String(deviceToken));
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing device token:', error);
    return res.status(500).json({ error: 'Failed to remove device token' });
  }
};

