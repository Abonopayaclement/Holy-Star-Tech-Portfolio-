import { Request, Response } from 'express';
import * as appointmentService from '../services/appointmentService';
import * as userService from '../services/userService';
import prisma from '../config/prisma';

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { branchId, serviceId, scheduledTime, notes } = req.body;
    const userId = (req as any).user.id;
    const user = await userService.getUserById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!branchId || !serviceId || !scheduledTime) {
      return res.status(400).json({ error: 'branchId, serviceId, and scheduledTime are required' });
    }

    const appointment = await appointmentService.createAppointment({
      userId: user.id,
      branchId,
      serviceId,
      scheduledTime: new Date(scheduledTime),
      notes,
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    res.status(400).json({ error: error.message || 'Failed to book appointment' });
  }
};

export const getUserAppointments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await userService.getUserById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const appointments = await appointmentService.getUserAppointments(user.id);
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getBranchAppointments = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const { date } = req.query;
    const appointments = await appointmentService.getBranchAppointments(
      branchId,
      new Date((date as string) || new Date())
    );
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const { status } = req.body;
    const staffId = (req as any).user?.id;
    const appointment = await appointmentService.updateAppointmentStatus(appointmentId, status, staffId);
    res.json(appointment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const userId = (req as any).user?.id;
    const appointment = await appointmentService.cancelAppointment(appointmentId, userId);
    res.json(appointment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to cancel appointment' });
  }
};

export const rescheduleAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const { scheduledTime } = req.body;
    const userId = (req as any).user?.id;

    if (!scheduledTime) {
      return res.status(400).json({ error: 'scheduledTime is required' });
    }

    const appointment = await appointmentService.rescheduleAppointment(
      appointmentId,
      new Date(scheduledTime),
      userId
    );
    res.json(appointment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to reschedule appointment' });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { branchId, serviceId, date } = req.query;

    if (!branchId || !serviceId || !date) {
      return res.status(400).json({ error: 'branchId, serviceId, and date query parameters are required' });
    }

    const slots = await appointmentService.getAvailableAppointmentSlots(
      branchId as string,
      serviceId as string,
      date as string
    );
    res.json(slots);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to retrieve available slots' });
  }
};

export const getAppointmentDetails = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch appointment details' });
  }
};

export const createRemoteRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { branchId, serviceId, problemType, categoryId, notes } = req.body;

    if (!branchId || !serviceId || (!problemType && !categoryId)) {
      return res.status(400).json({ error: 'branchId, serviceId, and problemType or categoryId are required' });
    }

    const appointment = await appointmentService.createRemoteAppointmentRequest({
      userId,
      branchId,
      serviceId,
      problemType: problemType || '',
      categoryId: categoryId || undefined,
      notes,
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    console.error('Error creating remote appointment request:', error);
    res.status(400).json({ error: error.message || 'Failed to submit remote request' });
  }
};

export const approveAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const { fee } = req.body;
    const staffUser = (req as any).user;

    if (fee === undefined || fee === null || fee === '' || isNaN(Number(fee)) || Number(fee) < 0) {
      return res.status(400).json({ error: 'Valid non-negative fee amount is required (GHS 0.00 or higher)' });
    }

    const appointment = await appointmentService.approveAppointment(appointmentId, Number(fee), staffUser);
    res.json(appointment);
  } catch (error: any) {
    console.error('Error approving appointment:', error);
    res.status(400).json({ error: error.message || 'Failed to approve appointment' });
  }
};

export const rejectAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const { rejectionReason, rejectionNote } = req.body;
    const staffUser = (req as any).user;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'rejectionReason is required' });
    }

    const appointment = await appointmentService.rejectAppointment(appointmentId, rejectionReason, rejectionNote, staffUser);
    res.json(appointment);
  } catch (error: any) {
    console.error('Error rejecting appointment:', error);
    res.status(400).json({ error: error.message || 'Failed to reject appointment' });
  }
};

export const payAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const userId = (req as any).user.id;

    const appointment = await appointmentService.confirmAndPayAppointment(appointmentId, userId);
    res.json(appointment);
  } catch (error: any) {
    console.error('Error processing appointment payment:', error);
    res.status(400).json({ error: error.message || 'Failed to process payment' });
  }
};

export const startAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const staffUser = (req as any).user;

    const appointment = await appointmentService.startAppointmentService(appointmentId, staffUser);
    res.json(appointment);
  } catch (error: any) {
    console.error('Error starting appointment:', error);
    res.status(400).json({ error: error.message || 'Failed to start appointment' });
  }
};

export const completeAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const staffUser = (req as any).user;

    const appointment = await appointmentService.completeAppointmentService(appointmentId, staffUser);
    res.json(appointment);
  } catch (error: any) {
    console.error('Error completing appointment:', error);
    res.status(400).json({ error: error.message || 'Failed to complete appointment' });
  }
};

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const userId = (req as any).user.id;
    const { isProblemSolved, feedbackNotes } = req.body;

    if (typeof isProblemSolved !== 'boolean') {
      return res.status(400).json({ error: 'isProblemSolved (boolean) is required' });
    }

    const appointment = await appointmentService.submitAppointmentFeedback(appointmentId, userId, {
      isProblemSolved,
      feedbackNotes,
    });
    res.json(appointment);
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(400).json({ error: error.message || 'Failed to submit feedback' });
  }
};

export const getBranchRemoteRequests = async (req: Request, res: Response) => {
  try {
    const branchId = req.params.branchId as string;
    const { status } = req.query;

    const appointments = await appointmentService.getBranchRemoteAppointments(branchId, status as string);
    res.json(appointments);
  } catch (error: any) {
    console.error('Error fetching branch remote requests:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const requestFollowUp = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const userId = (req as any).user?.id;
    const { followUpNote } = req.body || {};
    const updated = await appointmentService.requestAppointmentFollowUp(appointmentId, userId, followUpNote);
    res.json(updated);
  } catch (error: any) {
    console.error('Error requesting appointment follow-up:', error);
    res.status(400).json({ error: error.message || 'Failed to request follow-up' });
  }
};

export const staffFollowUpAction = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const staffUser = (req as any).user;
    const { action, instruction } = req.body || {};

    if (!action || !['DIRECT_TO_BRANCH', 'CREATE_FOLLOWUP_ATTEMPT', 'MARK_RESOLVED'].includes(action)) {
      return res.status(400).json({
        error: 'Valid action (DIRECT_TO_BRANCH, CREATE_FOLLOWUP_ATTEMPT, or MARK_RESOLVED) is required',
      });
    }

    const result = await appointmentService.staffAppointmentFollowUpAction(appointmentId, staffUser, {
      action,
      instruction,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error executing staff follow-up action:', error);
    res.status(400).json({ error: error.message || 'Failed to process follow-up action' });
  }
};

export const hideAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId as string;
    const userId = (req as any).user?.id;
    const updated = await appointmentService.hideCustomerAppointment(appointmentId, userId);
    res.json({ success: true, message: 'Appointment removed from your history', appointment: updated });
  } catch (error: any) {
    console.error('Error hiding appointment:', error);
    res.status(400).json({ error: error.message || 'Failed to remove appointment from history' });
  }
};

export const getPlatformAppointments = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (reqUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Super Admin platform oversight only' });
    }

    const { organizationId, branchId, serviceId, status, startDate, endDate } = req.query;

    const where: any = {};
    if (serviceId) {
      where.serviceId = serviceId as string;
    } else if (branchId) {
      where.branchId = branchId as string;
    } else if (organizationId) {
      where.branch = { organizationId: organizationId as string };
    }

    if (status && status !== 'ALL') {
      where.status = status as any;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      appointments,
    ] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: 'PENDING' } }),
      prisma.appointment.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.appointment.findMany({
        where,
        take: 100,
        orderBy: { scheduledTime: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          service: { select: { id: true, name: true, duration: true, price: true } },
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
              organization: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      summary: {
        total,
        pending,
        confirmed,
        completed,
        cancelled,
      },
      appointments: appointments.map((apt) => ({
        id: apt.id,
        scheduledTime: apt.scheduledTime,
        status: apt.status,
        notes: apt.notes,
        fee: apt.fee,
        customerName: apt.user?.fullName || 'Customer',
        customerEmail: apt.user?.email || '',
        customerPhone: apt.user?.phoneNumber || '',
        serviceName: apt.service?.name || 'Service',
        branchName: apt.branch?.name || 'Branch',
        organizationName: apt.branch?.organization?.name || 'Organization',
        organizationId: apt.branch?.organization?.id || '',
        branchId: apt.branch?.id || '',
        createdAt: apt.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error in getPlatformAppointments:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

