import { Request, Response } from 'express';
import * as callbackService from '../services/callbackService';
import prisma from '../config/prisma';
import { CallbackChannel, CallbackThreshold } from '@prisma/client';

export const createOrUpdateCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { queueEntryId, threshold, channel } = req.body;
    if (!queueEntryId || !threshold) {
      return res.status(400).json({ error: 'queueEntryId and threshold are required' });
    }

    const entry = await prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: { queue: { include: { branch: true } } },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    // Tenant and user authorization check
    if (entry.userId !== user.id && user.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Forbidden: You can only set callbacks for your own tickets' });
    }

    const callback = await callbackService.registerCallbackRequest({
      organizationId: entry.queue.branch.organizationId,
      branchId: entry.queue.branchId,
      userId: entry.userId,
      queueEntryId,
      threshold: threshold as CallbackThreshold,
      channel: channel as CallbackChannel,
    });

    return res.status(201).json(callback);
  } catch (error: any) {
    console.error('Error creating callback:', error);
    return res.status(500).json({ error: error.message || 'Failed to create callback request' });
  }
};

export const getActiveCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const entryId = String(req.params.entryId);
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    if (entry.userId !== user.id && user.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const callback = await callbackService.getActiveCallbackForEntry(entryId, user.id);
    return res.json(callback);
  } catch (error: any) {
    console.error('Error getting active callback:', error);
    return res.status(500).json({ error: 'Failed to retrieve active callback' });
  }
};

export const acknowledgeCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const callback = await callbackService.acknowledgeCallback(id, user.id);
    return res.json(callback);
  } catch (error: any) {
    console.error('Error acknowledging callback:', error);
    return res.status(error.message?.includes('Unauthorized') ? 403 : 500).json({
      error: error.message || 'Failed to acknowledge callback',
    });
  }
};

export const cancelCallback = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const { reason } = req.body;
    const callback = await callbackService.cancelCallback(id, reason || 'Customer cancelled', user.id);
    return res.json(callback);
  } catch (error: any) {
    console.error('Error cancelling callback:', error);
    return res.status(error.message?.includes('Unauthorized') ? 403 : 500).json({
      error: error.message || 'Failed to cancel callback',
    });
  }
};
