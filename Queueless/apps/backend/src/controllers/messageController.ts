import { Request, Response } from 'express';
import * as messageService from '../services/messageService';
import prisma from '../config/prisma';

export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { queueEntryId, appointmentId } = req.body;
    if (!queueEntryId && !appointmentId) {
      return res.status(400).json({ error: 'queueEntryId or appointmentId is required' });
    }

    const conversation = await messageService.getOrCreateConversation({
      userId: user.id,
      role: user.role,
      queueEntryId,
      appointmentId,
    });

    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error('Error getting or creating conversation:', error);
    const status = error.message?.includes('Forbidden')
      ? 403
      : error.message?.includes('not found')
      ? 404
      : 500;
    return res.status(status).json({ error: error.message || 'Failed to initialize conversation' });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        staff: { select: { id: true, fullName: true, email: true } },
        branch: { select: { id: true, name: true, organizationId: true } },
        queueEntry: { select: { id: true, ticketNumber: true, status: true, position: true } },
        appointment: { select: { id: true, status: true, scheduledTime: true } },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await messageService.getConversationMessages(id, user.id, user.role);

    return res.json({
      ...conversation,
      messages,
    });
  } catch (error: any) {
    console.error('Error getting conversation:', error);
    const status = error.message?.includes('Forbidden') ? 403 : 500;
    return res.status(status).json({ error: error.message || 'Failed to retrieve conversation' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const { message, metadata } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const sent = await messageService.sendMessage({
      conversationId: id,
      senderId: user.id,
      senderRole: user.role,
      message,
      metadata,
    });

    return res.status(201).json(sent);
  } catch (error: any) {
    console.error('Error sending message:', error);
    const status = error.message?.includes('Forbidden')
      ? 403
      : error.message?.includes('Rate limit')
      ? 429
      : error.message?.includes('not found')
      ? 404
      : 500;
    return res.status(status).json({ error: error.message || 'Failed to send message' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = String(req.params.id);
    const result = await messageService.markMessagesAsRead(id, user.id, user.role);
    return res.json(result);
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark messages as read' });
  }
};

export const getBranchConversations = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Forbidden: Staff access only' });
    }

    const branchId = String(req.params.branchId);
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { organizationId: true },
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const conversations = await messageService.getBranchConversations(
      branchId,
      branch.organizationId
    );

    return res.json(conversations);
  } catch (error: any) {
    console.error('Error fetching branch conversations:', error);
    return res.status(500).json({ error: 'Failed to retrieve branch conversations' });
  }
};
