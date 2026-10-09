import prisma from '../config/prisma';
import { io } from '../index';
import {
  SenderType,
  ConversationStatus,
  Role,
  NotificationPriority,
} from '@prisma/client';
import { createNotification } from './notificationService';
import { logAuditEvent } from '../utils/audit';

export interface GetOrCreateConversationParams {
  userId: string;
  role: Role;
  queueEntryId?: string;
  appointmentId?: string;
}

export interface SendMessageParams {
  conversationId: string;
  senderId: string;
  senderRole: Role;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Validates and retrieves or creates a scoped conversation for a queue ticket or appointment.
 * Guarantees strict multi-tenant and branch boundaries.
 */
export const getOrCreateConversation = async (params: GetOrCreateConversationParams) => {
  const { userId, role, queueEntryId, appointmentId } = params;

  if (!queueEntryId && !appointmentId) {
    throw new Error('Either queueEntryId or appointmentId must be provided');
  }

  let organizationId = '';
  let branchId = '';
  let customerId = '';
  let staffId: string | null = null;

  if (queueEntryId) {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: {
        queue: {
          include: {
            branch: { include: { organization: true } },
            service: true,
          },
        },
        user: true,
      },
    });

    if (!entry) throw new Error('Queue entry not found');

    organizationId = entry.queue.branch.organizationId;
    branchId = entry.queue.branchId;
    customerId = entry.userId;
    staffId = entry.servedByStaffId || null;

    // Authorization check
    if (role === Role.CUSTOMER && userId !== customerId) {
      throw new Error('Forbidden: You can only access your own ticket conversation');
    }
  } else if (appointmentId) {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        branch: { include: { organization: true } },
        service: true,
        user: true,
      },
    });

    if (!appt) throw new Error('Appointment not found');

    organizationId = appt.branch.organizationId;
    branchId = appt.branchId;
    customerId = appt.userId;

    // Authorization check
    if (role === Role.CUSTOMER && userId !== customerId) {
      throw new Error('Forbidden: You can only access your own appointment conversation');
    }
  }

  // If staff, verify staff belongs to organization
  if (role !== Role.CUSTOMER) {
    const staffUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, staffBranchId: true, role: true },
    });

    if (!staffUser || (staffUser.organizationId && staffUser.organizationId !== organizationId)) {
      throw new Error('Security Error: Cross-organization conversation access is forbidden');
    }

    if (staffUser.staffBranchId && staffUser.staffBranchId !== branchId && staffUser.role === Role.STAFF) {
      throw new Error('Security Error: Staff is not authorized for this branch conversation');
    }

    staffId = userId;
  }

  // Check for existing conversation
  const existing = await prisma.conversation.findFirst({
    where: {
      organizationId,
      branchId,
      customerId,
      ...(queueEntryId ? { queueEntryId } : {}),
      ...(appointmentId ? { appointmentId } : {}),
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      staff: { select: { id: true, fullName: true, email: true } },
      queueEntry: { select: { id: true, ticketNumber: true, status: true } },
      appointment: { select: { id: true, scheduledTime: true, status: true } },
    },
  });

  if (existing) {
    return existing;
  }

  // Create new conversation
  const created = await prisma.conversation.create({
    data: {
      organizationId,
      branchId,
      customerId,
      staffId: role !== Role.CUSTOMER ? userId : staffId,
      queueEntryId: queueEntryId || null,
      appointmentId: appointmentId || null,
      status: ConversationStatus.OPEN,
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      staff: { select: { id: true, fullName: true, email: true } },
      queueEntry: { select: { id: true, ticketNumber: true, status: true } },
      appointment: { select: { id: true, scheduledTime: true, status: true } },
    },
  });

  return created;
};

/**
 * Send a secure message within a conversation
 */
export const sendMessage = async (params: SendMessageParams) => {
  const { conversationId, senderId, senderRole, message, metadata } = params;

  if (!message || message.trim().length === 0) {
    throw new Error('Message text cannot be empty');
  }

  if (message.length > 2000) {
    throw new Error('Message exceeds maximum length of 2000 characters');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      branch: true,
      queueEntry: true,
      appointment: true,
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Authorization check
  const isCustomer = senderRole === Role.CUSTOMER;
  if (isCustomer && conversation.customerId !== senderId) {
    throw new Error('Forbidden: You cannot send messages in another customer conversation');
  }

  if (!isCustomer) {
    const staff = await prisma.user.findUnique({
      where: { id: senderId },
      select: { organizationId: true, staffBranchId: true, role: true },
    });
    if (!staff || (staff.organizationId && staff.organizationId !== conversation.organizationId)) {
      throw new Error('Forbidden: Cross-tenant messaging is strictly blocked');
    }
  }

  // Rate Limiting Protection (Part 31)
  // Check if sender has sent > 15 messages in the last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentCount = await prisma.message.count({
    where: {
      conversationId,
      senderId,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (recentCount >= 15) {
    throw new Error('Rate limit exceeded: Please wait before sending more messages.');
  }

  const senderType = isCustomer ? SenderType.CUSTOMER : SenderType.STAFF;

  // Persist message
  const createdMessage = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      senderType,
      message: message.trim(),
      metadata: metadata || undefined,
      isRead: false,
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  // Assign staff to conversation if not already assigned
  if (!isCustomer && !conversation.staffId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { staffId: senderId },
    }).catch(() => null);
  }

  // Real-time socket broadcast
  if (io) {
    io.to(`conversation_${conversationId}`).emit('new_message', {
      message: createdMessage,
      conversationId,
    });

    if (isCustomer) {
      // Notify branch staff room
      io.to(`branch_${conversation.branchId}`).emit('new_message_alert', {
        conversationId,
        senderName: createdMessage.sender.fullName,
        message: createdMessage.message,
      });
    } else {
      // Notify customer room
      io.to(`user_${conversation.customerId}`).emit('new_message_alert', {
        conversationId,
        senderName: createdMessage.sender.fullName,
        message: createdMessage.message,
      });
    }
  }

  // Create notifications
  if (isCustomer) {
    // Notify staff of incoming customer message
    await createNotification({
      branchId: conversation.branchId,
      organizationId: conversation.organizationId,
      type: 'STAFF_CUSTOMER_MESSAGE',
      title: 'New Customer Message',
      message: `${createdMessage.sender.fullName}: "${createdMessage.message.slice(0, 100)}"`,
      priority: NotificationPriority.IMPORTANT,
      entityType: 'CONVERSATION',
      entityId: conversationId,
      metadata: {
        conversationId,
        senderId,
        ticketId: conversation.queueEntryId,
        appointmentId: conversation.appointmentId,
      },
    });
  } else {
    // Notify customer of staff message
    await createNotification({
      userId: conversation.customerId,
      branchId: conversation.branchId,
      organizationId: conversation.organizationId,
      type: 'CUSTOMER_STAFF_MESSAGE',
      title: 'Message from Service Counter',
      message: `${createdMessage.sender.fullName}: "${createdMessage.message.slice(0, 100)}"`,
      priority: NotificationPriority.IMPORTANT,
      entityType: 'CONVERSATION',
      entityId: conversationId,
      metadata: {
        conversationId,
        senderId,
        ticketId: conversation.queueEntryId,
        appointmentId: conversation.appointmentId,
      },
    });
  }

  await logAuditEvent({
    organizationId: conversation.organizationId,
    branchId: conversation.branchId,
    userId: senderId,
    action: 'MESSAGE_SENT',
    details: {
      messageId: createdMessage.id,
      conversationId,
      senderType,
    },
  });

  return createdMessage;
};

/**
 * Retrieve messages for an authorized user
 */
export const getConversationMessages = async (
  conversationId: string,
  userId: string,
  role: Role,
  options?: { limit?: number; offset?: number }
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new Error('Conversation not found');

  if (role === Role.CUSTOMER && conversation.customerId !== userId) {
    throw new Error('Forbidden: Unauthorized to view these messages');
  }

  if (role !== Role.CUSTOMER) {
    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    if (staff?.organizationId && staff.organizationId !== conversation.organizationId) {
      throw new Error('Forbidden: Cross-organization message access denied');
    }
  }

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: limit,
    skip: offset,
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  });

  return messages;
};

/**
 * Mark all unread messages sent by the other party as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string,
  role: Role
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) throw new Error('Conversation not found');

  // We want to mark messages not sent by `userId` as read
  const updated = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  if (updated.count > 0 && io) {
    io.to(`conversation_${conversationId}`).emit('messages_read', {
      conversationId,
      readerId: userId,
    });
  }

  return updated;
};

/**
 * Retrieve active conversations for a branch (Staff view)
 */
export const getBranchConversations = async (
  branchId: string,
  organizationId: string
) => {
  return await prisma.conversation.findMany({
    where: {
      branchId,
      organizationId,
      status: ConversationStatus.OPEN,
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      staff: { select: { id: true, fullName: true } },
      queueEntry: { select: { id: true, ticketNumber: true, position: true, status: true } },
      appointment: { select: { id: true, scheduledTime: true, status: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};
