import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import * as queueService from '../services/queueService';
import * as userService from '../services/userService';
import { logAuditEvent } from '../utils/audit';
import { validateCancellationReason } from '../constants/cancellationReasons';

export const joinQueue = async (req: Request, res: Response) => {
  try {
    const { queueId, isRemote, qrToken, priority, notificationPreference } = req.body;
    if (!queueId) {
      return res.status(400).json({ error: 'queueId is required' });
    }

    const userId = (req as any).user.id;
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If joining via QR code, validate QR token strictly
    if (qrToken) {
      const cleanToken = String(qrToken).trim();
      const qr = await prisma.qRCode.findUnique({
        where: { token: cleanToken },
        include: { service: true, branch: true },
      });

      if (!qr) {
        return res.status(400).json({
          error: 'Invalid QR code token. Please scan a current QueueLess QR code.',
          code: 'QR_NOT_FOUND',
        });
      }

      if (qr.status === 'REVOKED') {
        await logAuditEvent({
          organizationId: qr.organizationId,
          branchId: qr.branchId,
          userId: user.id,
          action: 'QR_JOIN_REJECTED',
          details: { reason: 'QR_REVOKED', token: cleanToken, queueId },
        });
        return res.status(400).json({
          error: 'This QR code has been closed by the organization. You can still join the queue manually from the QueueLess app.',
          code: 'QR_REVOKED',
        });
      }

      const isExpired = qr.status === 'EXPIRED' || (qr.expiresAt && new Date(qr.expiresAt) < new Date());
      if (isExpired) {
        if (qr.status !== 'EXPIRED') {
          await prisma.qRCode.update({
            where: { id: qr.id },
            data: { status: 'EXPIRED' },
          });
        }
        await logAuditEvent({
          organizationId: qr.organizationId,
          branchId: qr.branchId,
          userId: user.id,
          action: 'QR_JOIN_REJECTED',
          details: { reason: 'QR_EXPIRED', token: cleanToken, queueId },
        });
        return res.status(400).json({
          error: 'This QR code has expired. Please use another QR code or join the service manually from the QueueLess app.',
          code: 'QR_EXPIRED',
        });
      }

      // Check destination matches queue service
      const targetQueue = await prisma.queue.findUnique({
        where: { id: queueId },
        include: { service: true, branch: true },
      });

      if (!targetQueue) {
        return res.status(404).json({ error: 'Target queue not found' });
      }

      if (qr.serviceId && targetQueue.serviceId !== qr.serviceId) {
        return res.status(400).json({
          error: 'Security Error: QR code destination does not match target service queue.',
          code: 'SERVICE_MISMATCH',
        });
      }

      if (targetQueue.status === 'CLOSED') {
        await logAuditEvent({
          organizationId: qr.organizationId,
          branchId: qr.branchId,
          userId: user.id,
          action: 'QR_JOIN_REJECTED',
          details: { reason: 'QUEUE_CLOSED', token: cleanToken, queueId },
        });
        return res.status(400).json({
          error: `Queue Currently Closed: ${targetQueue.service.name} is not accepting new customers right now. Existing customers are still being served.`,
          code: 'QUEUE_CLOSED',
        });
      }

      // Enter the unified queue engine
      const entry = await queueService.joinQueue(user.id, queueId, {
        isRemote: !!isRemote,
        isQr: true,
        qrId: qr.id,
        priority,
        notificationPreference,
      });

      return res.status(201).json(entry);
    }

    // Manual join (without QR token)
    const entry = await queueService.joinQueue(user.id, queueId, {
      isRemote: !!isRemote,
      priority,
      notificationPreference,
    });
    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error joining queue:', error);
    res.status(400).json({ error: error.message || 'Failed to join queue' });
  }
};

/**
 * Staff-assisted walk-in ticket creation.
 * Enters the same queue engine as mobile customers.
 */
export const createWalkInTicket = async (req: Request, res: Response) => {
  try {
    let { queueId, serviceId, branchId, fullName, phoneNumber } = req.body;

    // If serviceId provided instead of queueId, resolve service queue
    if (!queueId && serviceId) {
      const activeQueue = await prisma.queue.findFirst({
        where: {
          serviceId,
          ...(branchId ? { branchId } : {}),
        },
      });
      if (activeQueue) {
        queueId = activeQueue.id;
      }
    }

    if (!queueId) {
      return res.status(400).json({ error: 'queueId or an active serviceId is required' });
    }

    // Verify queue existence
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { branch: true, service: true },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    if (queue.status === 'CLOSED') {
      return res.status(400).json({ error: 'This queue is currently closed' });
    }

    // Check staff affiliation if applicable
    const staffUser = (req as any).user;
    if (staffUser?.role === 'STAFF' && staffUser?.staffBranchId && staffUser.staffBranchId !== queue.branchId) {
      return res.status(403).json({ error: 'Staff can only issue tickets for their assigned branch' });
    }

    // Find existing customer by phone or generate a lightweight walk-in customer profile
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
          email: `walkin_${tempSuffix}@queueless.internal`,
          passwordHash,
          fullName: fullName?.trim() || 'Walk-in Customer',
          phoneNumber: phoneNumber?.trim() || null,
          role: 'CUSTOMER',
        },
      });
    }

    // Pass customer to the EXACT SAME queue engine
    const entry = await queueService.joinQueue(customerUser.id, queueId, { isWalkIn: true });

    res.status(201).json({
      entry,
      ticketNumber: entry.ticketNumber,
      position: entry.position,
      serviceName: queue.service.name,
      branchName: queue.branch.name,
      customer: {
        id: customerUser.id,
        fullName: customerUser.fullName,
        phoneNumber: customerUser.phoneNumber,
      },
    });
  } catch (error: any) {
    console.error('Error creating walk-in ticket:', error);
    res.status(400).json({ error: error.message || 'Failed to create walk-in ticket' });
  }
};

export const callNext = async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const staffId = (req as any).user?.id;
    const counterNumber = (req.body?.counterNumber || req.query?.counterNumber || (req as any).user?.counterNumber) as string | undefined;
    const entry = await queueService.callNext(queueId, staffId, { counterNumber });
    if (!entry) return res.status(404).json({ message: 'No customers waiting in this queue' });
    res.json(entry);
  } catch (error: any) {
    console.error('Error calling next customer:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const startServing = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const staffId = (req as any).user?.id;
    const counterNumber = (req.body?.counterNumber || req.query?.counterNumber) as string | undefined;
    const entry = await queueService.startServing(entryId, staffId, { counterNumber });
    res.json(entry);
  } catch (error: any) {
    console.error('Error starting service:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const completeEntry = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const staffId = (req as any).user?.id;
    const entry = await queueService.completeEntry(entryId, staffId);
    res.json(entry);
  } catch (error: any) {
    console.error('Error completing entry:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const skipEntry = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const staffId = (req as any).user?.id;
    const entry = await queueService.skipEntry(entryId, staffId);
    res.json(entry);
  } catch (error: any) {
    console.error('Error skipping entry:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const recallSkippedEntry = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const staffId = (req as any).user?.id;
    const { action, counterNumber } = req.body || {};
    const entry = await queueService.recallSkippedEntry(entryId, staffId, { action, counterNumber });
    res.json(entry);
  } catch (error: any) {
    console.error('Error recalling skipped entry:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const cancelEntry = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const reqUser = (req as any).user;
    const userId = reqUser?.id;
    const userRole = reqUser?.role;
    const { reason, reasonNote } = req.body || {};

    // Check if the user cancelling is staff or manager
    const isStaffOrManager = ['STAFF', 'BRANCH_MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    let formattedReason: string | undefined;
    let cancelledBy: string | undefined;

    if (isStaffOrManager) {
      // Validate cancellation reason for staff
      const validation = validateCancellationReason(reason, reasonNote);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: validation.error || 'A valid cancellation reason is required for staff cancellations' 
        });
      }
      formattedReason = validation.formattedReason;
      cancelledBy = reqUser.fullName || reqUser.email || 'Staff';
    } else {
      // Customer voluntarily cancelling ticket
      formattedReason = reasonNote || reason || 'Voluntarily cancelled by customer';
      cancelledBy = reqUser?.fullName || 'Customer';
    }

    const entry = await queueService.cancelEntry(entryId, userId, {
      cancellationReason: formattedReason,
      cancelledBy,
    });
    res.json(entry);
  } catch (error: any) {
    console.error('Error cancelling ticket:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const entries = await queueService.getLiveQueueStatus(queueId);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTicket = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const ticket = await queueService.getCustomerTicketStatus(entryId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyActiveTicket = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const ticket = await queueService.getUserActiveTicket(userId);
    res.json(ticket || null);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyQueueHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const history = await queueService.getUserQueueHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update service queue OPEN/CLOSED status.
 * Authorized staff and branch managers only.
 */
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const { status, closedReason } = req.body;

    if (!status || !['OPEN', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (OPEN or CLOSED) is required' });
    }

    const reqUser = (req as any).user;
    const updated = await queueService.updateQueueStatus(queueId, status, closedReason, reqUser?.id);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating queue status:', error);
    res.status(400).json({ error: error.message || 'Failed to update queue status' });
  }
};

export const hideQueueEntry = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const userId = (req as any).user?.id;
    const updated = await queueService.hideCustomerQueueEntry(entryId, userId);
    res.json({ success: true, message: 'Ticket removed from your history', entry: updated });
  } catch (error: any) {
    console.error('Error hiding queue entry:', error);
    res.status(400).json({ error: error.message || 'Failed to remove ticket from history' });
  }
};

/**
 * Transfer a ticket to another service in the branch.
 * Authorized staff only.
 */
export const transferTicket = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const { destinationServiceId, reason, reasonNote } = req.body;

    if (!destinationServiceId) {
      return res.status(400).json({ error: 'destinationServiceId is required' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A transfer reason is required' });
    }

    const staffUser = (req as any).user;
    const updated = await queueService.transferTicket(
      entryId,
      destinationServiceId,
      staffUser?.id,
      { reason, reasonNote }
    );

    res.json({
      success: true,
      message: `Ticket successfully transferred to ${updated.queue.service.name}`,
      entry: updated,
    });
  } catch (error: any) {
    console.error('Error transferring ticket:', error);
    res.status(400).json({ error: error.message || 'Failed to transfer ticket' });
  }
};

/**
 * Update a ticket's priority level.
 * Authorized staff/managers only.
 */
export const updateTicketPriority = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const { priority, reason } = req.body;

    const validPriorities = ['NORMAL', 'PRIORITY', 'APPOINTMENT'];
    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({ error: `Valid priority (${validPriorities.join(', ')}) is required` });
    }

    const staffUser = (req as any).user;
    const updated = await queueService.updateTicketPriority(entryId, priority, staffUser?.id, reason);
    res.json({ success: true, entry: updated });
  } catch (error: any) {
    console.error('Error updating ticket priority:', error);
    res.status(400).json({ error: error.message || 'Failed to update priority' });
  }
};

/**
 * Update a customer's notification/callback preference for an active ticket.
 */
export const updateNotificationPreference = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const { preference } = req.body;

    const validPrefs = ['STANDARD', 'NOTIFY_APPROACHING_5', 'NOTIFY_APPROACHING_2', 'NOTIFY_CALLED_ONLY'];
    if (!preference || !validPrefs.includes(preference)) {
      return res.status(400).json({ error: `Valid preference (${validPrefs.join(', ')}) is required` });
    }

    const userId = (req as any).user?.id;
    const updated = await queueService.updateNotificationPreference(entryId, userId, preference);
    res.json({ success: true, preference: updated.notificationPreference });
  } catch (error: any) {
    console.error('Error updating notification preference:', error);
    res.status(400).json({ error: error.message || 'Failed to update notification preference' });
  }
};

/**
 * Get queue operating policy
 */
export const getQueuePolicy = async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const policy = await queueService.getQueuePolicy(queueId);
    res.json(policy);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Queue policy not found' });
  }
};

/**
 * Update queue operating policy
 */
export const updateQueuePolicy = async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const staffUser = (req as any).user;
    const updated = await queueService.updateQueuePolicy(queueId, req.body, staffUser?.id);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating queue policy:', error);
    res.status(400).json({ error: error.message || 'Failed to update queue policy' });
  }
};

/**
 * Branch-level staff availability overview
 */
export const getBranchStaffAvailability = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const { getBranchStaffAvailability: getAvail } = await import('../services/staffAssignmentService');
    const report = await getAvail(branchId);
    res.json(report);
  } catch (error: any) {
    console.error('Error fetching branch staff availability:', error);
    res.status(400).json({ error: error.message || 'Failed to fetch staff availability' });
  }
};

/**
 * Service-level staff assignment report
 */
export const getServiceStaffAssignment = async (req: Request, res: Response) => {
  try {
    const serviceId = req.params.serviceId as string;
    const { evaluateServiceStaffAssignment } = await import('../services/staffAssignmentService');
    const report = await evaluateServiceStaffAssignment(serviceId);
    res.json(report);
  } catch (error: any) {
    console.error('Error evaluating service staff assignment:', error);
    res.status(400).json({ error: error.message || 'Failed to evaluate staff assignment' });
  }
};/**
 * Public/Customer printable ticket slip data (Part 10)
 */
export const getPrintableTicket = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const { generatePrintableTicketData } = await import('../services/ticketPrintService');
    const ticketData = await generatePrintableTicketData(entryId);
    res.json(ticketData);
  } catch (error: any) {
    console.error('Error fetching printable ticket:', error);
    res.status(404).json({ error: error.message || 'Ticket not found' });
  }
};

/**
 * Controlled ticket reprint with audit logging (Part 11)
 */
export const reprintTicket = async (req: Request, res: Response) => {
  try {
    const entryId = req.params.entryId as string;
    const staffUser = (req as any).user;
    const reason = req.body?.reason || 'Staff requested reprint';
    const { reprintTicket: doReprint } = await import('../services/ticketPrintService');
    const ticketData = await doReprint(entryId, reason, staffUser?.id);
    res.json(ticketData);
  } catch (error: any) {
    console.error('Error reprinting ticket:', error);
    res.status(400).json({ error: error.message || 'Failed to reprint ticket' });
  }
};
