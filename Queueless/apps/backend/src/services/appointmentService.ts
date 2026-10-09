// Appointment service handling lifecycle, follow-up workflows, and soft-hiding
import prisma from '../config/prisma';
import { io } from '../index';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { logAuditEvent } from '../utils/audit';
import * as notificationService from './notificationService';

export interface CreateAppointmentInput {
  userId: string;
  branchId: string;
  serviceId: string;
  scheduledTime: Date;
  notes?: string;
}

export const createAppointment = async (data: CreateAppointmentInput) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify branch exists and is active
    const branch = await tx.branch.findUnique({
      where: { id: data.branchId },
      include: { organization: true },
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    if (!branch.isActive) {
      throw new Error('This branch is currently inactive for appointments');
    }

    // 2. Verify service exists, is active, and belongs to this branch
    const service = await tx.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service || service.branchId !== data.branchId) {
      throw new Error('Service not offered at this branch');
    }

    if (!service.isActive) {
      throw new Error('This service is currently not available for booking');
    }

    // 3. Time validation: must be in the future
    const scheduledTime = new Date(data.scheduledTime);
    const now = new Date();
    if (scheduledTime.getTime() < now.getTime() + 10 * 60 * 1000) {
      throw new Error('Appointments must be booked at least 10 minutes in advance');
    }

    // 4. Operating hours check (default 08:00 to 18:00)
    const hours = scheduledTime.getHours();
    const day = scheduledTime.getDay();
    if (day === 0) {
      throw new Error('Appointments cannot be scheduled on Sundays');
    }
    if (hours < 8 || hours >= 18) {
      throw new Error('Selected time is outside branch operating hours (08:00 - 18:00)');
    }

    // 5. Double-booking conflict check:
    // Window is [scheduledTime - duration + 1 min, scheduledTime + duration - 1 min]
    const durationMs = (service.duration || 15) * 60 * 1000;
    const windowStart = new Date(scheduledTime.getTime() - durationMs + 60000);
    const windowEnd = new Date(scheduledTime.getTime() + durationMs - 60000);

    const conflictingBooking = await tx.appointment.findFirst({
      where: {
        branchId: data.branchId,
        serviceId: data.serviceId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        scheduledTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });

    if (conflictingBooking) {
      throw new Error('This time slot is already booked. Please choose another time.');
    }

    // Also check if customer already has an appointment at this exact time
    const userConflict = await tx.appointment.findFirst({
      where: {
        userId: data.userId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        scheduledTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });

    if (userConflict) {
      throw new Error('You already have another appointment booked around this time.');
    }

    // 6. Create appointment
    const appointment = await tx.appointment.create({
      data: {
        userId: data.userId,
        branchId: data.branchId,
        serviceId: data.serviceId,
        scheduledTime,
        status: AppointmentStatus.CONFIRMED, // Auto-confirm on valid slot
        notes: data.notes,
      },
      include: {
        branch: { select: { id: true, name: true, location: true } },
        service: { select: { id: true, name: true, duration: true } },
      },
    });

    // 7. Audit log
    await logAuditEvent({
      organizationId: branch.organizationId,
      branchId: branch.id,
      userId: data.userId,
      action: 'APPOINTMENT_BOOKED',
      details: { appointmentId: appointment.id, scheduledTime: appointment.scheduledTime },
    });

    try {
      await notificationService.createNotification({
        userId: data.userId,
        branchId: branch.id,
        organizationId: branch.organizationId,
        type: 'APPOINTMENT_REQUESTED',
        title: 'Appointment Booked',
        message: `Your appointment for ${appointment.service?.name || 'service'} on ${scheduledTime.toLocaleDateString()} has been scheduled.`,
        priority: 'NORMAL',
        entityType: 'APPOINTMENT',
        entityId: appointment.id,
        metadata: { appointmentId: appointment.id, scheduledTime },
      });

      await notificationService.createNotification({
        branchId: branch.id,
        organizationId: branch.organizationId,
        type: 'STAFF_NEW_APPOINTMENT_REQUEST',
        title: 'New Appointment Booked',
        message: `New appointment booked for ${appointment.service?.name || 'service'} on ${scheduledTime.toLocaleDateString()}.`,
        priority: 'NORMAL',
        entityType: 'APPOINTMENT',
        entityId: appointment.id,
        metadata: { appointmentId: appointment.id, scheduledTime },
      });
    } catch (notifErr) {
      console.warn('Notification error on booking:', notifErr);
    }

    return appointment;
  });
};

export const getUserAppointments = async (userId: string) => {
  return await prisma.appointment.findMany({
    where: { 
      userId,
      isCustomerHidden: false,
    },
    include: {
      branch: { select: { id: true, name: true, location: true, organization: { select: { name: true } } } },
      service: { select: { id: true, name: true, duration: true, price: true } },
      category: { select: { id: true, name: true } },
      originalAppointment: { select: { id: true, problemType: true, status: true } },
      followUps: { select: { id: true, problemType: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getBranchAppointments = async (branchId: string, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.appointment.findMany({
    where: {
      branchId,
      scheduledTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      service: { select: { id: true, name: true, duration: true } },
    },
    orderBy: { scheduledTime: 'asc' },
  });
};

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus, staffUserId?: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { branch: true },
  });

  if (!existing) throw new Error('Appointment not found');

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId: staffUserId,
    action: `APPOINTMENT_STATUS_${status}`,
    details: { appointmentId: id, previousStatus: existing.status, newStatus: status },
  });

  return appointment;
};

export const rescheduleAppointment = async (id: string, newTime: Date, userId: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { branch: true, service: true },
  });

  if (!existing) throw new Error('Appointment not found');
  if (existing.userId !== userId) throw new Error('Unauthorized to reschedule this appointment');

  const scheduledTime = new Date(newTime);
  const durationMs = (existing.service.duration || 15) * 60 * 1000;
  const windowStart = new Date(scheduledTime.getTime() - durationMs + 60000);
  const windowEnd = new Date(scheduledTime.getTime() + durationMs - 60000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      id: { not: id },
      branchId: existing.branchId,
      serviceId: existing.serviceId,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      scheduledTime: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
  });

  if (conflict) {
    throw new Error('This new time slot is already booked. Please choose another.');
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      scheduledTime,
      status: AppointmentStatus.CONFIRMED,
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId,
    action: 'APPOINTMENT_RESCHEDULED',
    details: { appointmentId: id, newScheduledTime: scheduledTime },
  });

  return updated;
};

export const cancelAppointment = async (id: string, userId: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: { branch: true },
  });

  if (!existing) throw new Error('Appointment not found');

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: AppointmentStatus.CANCELLED },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId,
    action: 'APPOINTMENT_CANCELLED',
    details: { appointmentId: id },
  });

  return updated;
};

export interface AppointmentSlot {
  time: string; // e.g. "09:30"
  datetime: string; // ISO string
  available: boolean;
  reason?: string;
}

/**
 * Get dynamic available consultation time slots for a branch, service, and date
 */
export const getAvailableAppointmentSlots = async (
  branchId: string,
  serviceId: string,
  dateStr: string
): Promise<AppointmentSlot[]> => {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });
  if (!branch || !branch.isActive) {
    throw new Error('Branch is not active or not found');
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });
  if (!service || !service.isActive) {
    throw new Error('Service is not active or not found');
  }

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) {
    throw new Error('Invalid date provided');
  }

  // Check if Sunday
  if (targetDate.getDay() === 0) {
    return [];
  }

  // Query existing booked appointments on this day for this branch and service
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.appointment.findMany({
    where: {
      branchId,
      serviceId,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      scheduledTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      scheduledTime: true,
    },
  });

  const durationMs = (service.duration || 15) * 60 * 1000;
  const now = new Date();

  // Generate standard slots from 08:30 to 17:00 at 30-minute intervals
  const slots: AppointmentSlot[] = [];
  const baseDate = new Date(dateStr);
  baseDate.setHours(0, 0, 0, 0);

  const standardTimes = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00'
  ];

  for (const time of standardTimes) {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(baseDate);
    slotDate.setHours(hours, minutes, 0, 0);

    const isPast = slotDate.getTime() < now.getTime() + 10 * 60 * 1000;

    // Check collision with any existing booking
    const windowStart = new Date(slotDate.getTime() - durationMs + 60000);
    const windowEnd = new Date(slotDate.getTime() + durationMs - 60000);

    const hasConflict = existingBookings.some((b) => {
      if (!b.scheduledTime) return false;
      const bookedTime = new Date(b.scheduledTime).getTime();
      return bookedTime >= windowStart.getTime() && bookedTime <= windowEnd.getTime();
    });

    let available = true;
    let reason: string | undefined;

    if (isPast) {
      available = false;
      reason = 'Past time';
    } else if (hasConflict) {
      available = false;
      reason = 'Already booked';
    }

    slots.push({
      time,
      datetime: slotDate.toISOString(),
      available,
      reason,
    });
  }

  return slots;
};

export interface RemoteAppointmentRequestInput {
  userId: string;
  branchId: string;
  serviceId: string;
  problemType?: string;
  categoryId?: string;
  notes?: string;
}

export const createRemoteAppointmentRequest = async (data: RemoteAppointmentRequestInput) => {
  const branch = await prisma.branch.findUnique({
    where: { id: data.branchId },
    include: { organization: true },
  });
  if (!branch || !branch.isActive) {
    throw new Error('This branch is currently inactive for appointment requests');
  }

  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
  });
  if (!service || service.branchId !== data.branchId || !service.isActive) {
    throw new Error('Service not available at this branch');
  }

  let problemType = data.problemType || '';
  let categoryId = data.categoryId || null;

  if (categoryId) {
    const cat = await prisma.appointmentCategory.findUnique({
      where: { id: categoryId },
    });
    if (cat && cat.isActive && cat.organizationId === branch.organizationId) {
      problemType = cat.name;
    } else if (!problemType) {
      throw new Error('Invalid or inactive appointment category for this branch');
    }
  }

  if (!problemType) {
    throw new Error('Problem type or category is required');
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: data.userId,
      branchId: data.branchId,
      serviceId: data.serviceId,
      problemType,
      categoryId,
      notes: data.notes || null,
      status: AppointmentStatus.PENDING,
      scheduledTime: new Date(),
    },
    include: {
      branch: { select: { id: true, name: true, location: true, organizationId: true, organization: { select: { name: true } } } },
      service: { select: { id: true, name: true, duration: true } },
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      category: { select: { id: true, name: true } },
    },
  });

  try {
    await logAuditEvent({
      organizationId: branch.organizationId,
      branchId: branch.id,
      userId: data.userId,
      action: 'APPOINTMENT_REQUESTED',
      details: {
        appointmentId: appointment.id,
        problemType,
        categoryId,
        serviceId: data.serviceId,
      },
    });

    // Customer Notification
    await notificationService.createNotification({
      userId: data.userId,
      branchId: branch.id,
      organizationId: branch.organizationId,
      type: 'APPOINTMENT_REQUESTED',
      title: 'Appointment Request Submitted',
      message: `Your request for ${service.name} (${problemType}) has been submitted and is waiting for staff approval.`,
      priority: 'NORMAL',
      entityType: 'APPOINTMENT',
      entityId: appointment.id,
      metadata: {
        appointmentId: appointment.id,
        serviceName: service.name,
        problemType,
      },
    });

    // Staff Notification
    await notificationService.createNotification({
      branchId: branch.id,
      organizationId: branch.organizationId,
      type: 'STAFF_NEW_APPOINTMENT_REQUEST',
      title: 'New Remote Appointment Request',
      message: `New request for ${service.name} (${problemType}) submitted by ${appointment.user?.fullName || 'Customer'}.`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointment.id,
      metadata: {
        appointmentId: appointment.id,
        serviceName: service.name,
        problemType,
        customerName: appointment.user?.fullName,
      },
    });
  } catch (err) {
    console.warn('Side effect error during appointment request creation:', err);
  }

  if (io) {
    io.to(`branch_${branch.id}`).emit('new_appointment_request', {
      type: 'APPOINTMENT_REQUEST_CREATED',
      appointment,
    });
  }

  return appointment;
};

export const approveAppointment = async (appointmentId: string, fee: number, staffUser: any) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: true, service: true, user: true },
  });

  if (!existing) throw new Error('Appointment not found');

  if (existing.status !== AppointmentStatus.PENDING) {
    throw new Error(`Cannot approve appointment with current status ${existing.status}`);
  }

  const parsedFee = Number(fee);
  if (isNaN(parsedFee) || parsedFee < 0) {
    throw new Error('Valid non-negative fee amount is required (0.00 or higher)');
  }
  const validFee = parsedFee;
  const isFree = validFee === 0;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.APPROVED,
      fee: validFee,
      approvedAt: new Date(),
      approvedBy: staffUser?.fullName || staffUser?.email || 'Staff',
    },
    include: {
      branch: { select: { id: true, name: true, location: true, organizationId: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId: staffUser?.id,
    action: 'APPOINTMENT_APPROVED',
    details: { appointmentId, fee: validFee, isFree },
  });

  // Customer notification with fee / free status
  if (isFree) {
    await notificationService.createNotification({
      userId: existing.userId,
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'APPOINTMENT_APPROVED',
      title: 'Appointment Approved (Free Service)',
      message: `Your request for ${existing.service.name} has been approved. This appointment is free. No payment is required. Staff will begin handling shortly.`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: {
        appointmentId,
        fee: 0,
        isFree: true,
        serviceName: existing.service.name,
        problemType: existing.problemType,
      },
    });
  } else {
    await notificationService.createNotification({
      userId: existing.userId,
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'PAYMENT_REQUIRED',
      title: 'Appointment Approved — Payment Required',
      message: `Your request for ${existing.service.name} assistance has been approved. Service fee: GHS ${validFee.toFixed(2)}. Please confirm and make payment to continue.`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: {
        appointmentId,
        fee: validFee,
        isFree: false,
        requiresPayment: true,
        serviceName: existing.service.name,
        problemType: existing.problemType,
      },
    });
  }

  if (io) {
    io.to(`user_${existing.userId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_APPROVED',
      appointment: updated,
    });
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_APPROVED',
      appointment: updated,
    });
  }

  return updated;
};

export const rejectAppointment = async (
  appointmentId: string,
  rejectionReason: string,
  rejectionNote?: string,
  staffUser?: any
) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: true, service: true, user: true },
  });

  if (!existing) throw new Error('Appointment not found');

  if (existing.status !== AppointmentStatus.PENDING) {
    throw new Error(`Cannot reject appointment with current status ${existing.status}`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.REJECTED,
      rejectionReason,
      rejectionNote: rejectionNote || null,
    },
    include: {
      branch: { select: { id: true, name: true, location: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId: staffUser?.id,
    action: 'APPOINTMENT_REJECTED',
    details: { appointmentId, rejectionReason, rejectionNote },
  });

  // Customer notification with reason
  await notificationService.createNotification({
    userId: existing.userId,
    branchId: existing.branchId,
    organizationId: existing.branch.organizationId,
    type: 'APPOINTMENT_REJECTED',
    title: 'Appointment Not Approved',
    message: `Your appointment request for ${existing.service.name} was not approved. Reason: ${rejectionReason}${rejectionNote ? ' (' + rejectionNote + ')' : ''}`,
    priority: 'URGENT',
    entityType: 'APPOINTMENT',
    entityId: appointmentId,
    metadata: {
      appointmentId,
      rejectionReason,
      rejectionNote,
    },
  });

  if (io) {
    io.to(`user_${existing.userId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_REJECTED',
      appointment: updated,
    });
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_REJECTED',
      appointment: updated,
    });
  }

  return updated;
};

export const confirmAndPayAppointment = async (appointmentId: string, userId: string) => {
  // 1. Fetch and strictly validate appointment state
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      branch: { select: { id: true, name: true, location: true, organizationId: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  if (!existing) {
    throw new Error('Appointment not found');
  }

  if (existing.userId !== userId) {
    throw new Error('Unauthorized: You do not own this appointment');
  }

  if (existing.status === AppointmentStatus.PAID) {
    throw new Error('This appointment has already been paid for.');
  }

  if (existing.status !== AppointmentStatus.APPROVED && existing.status !== AppointmentStatus.PAYMENT_PENDING) {
    throw new Error(`Cannot process payment for appointment in status ${existing.status}`);
  }

  const amount = Number(existing.fee);
  if (existing.fee !== null && amount === 0) {
    throw new Error('This appointment is free; no payment is required.');
  }
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Service fee has not been assessed by branch staff yet');
  }

  const transactionRef = `TEST_PAY_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 2. Atomic Database Transaction: Payment record + Appointment status transition
  const updated = await prisma.$transaction(async (tx) => {
    // Record test payment
    await tx.payment.create({
      data: {
        userId,
        amount,
        currency: existing.feeCurrency || 'GHS',
        status: PaymentStatus.COMPLETED,
        transactionRef,
        metadata: {
          appointmentId,
          isTestPayment: true,
          problemType: existing.problemType,
          categoryId: existing.categoryId,
        },
      },
    });

    // Update appointment status to PAID
    return await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.PAID,
        paidAt: new Date(),
      },
      include: {
        branch: { select: { id: true, name: true, location: true, organizationId: true } },
        service: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  });

  // 3. Side effects outside transaction (cannot deadlock or fail the DB commit)
  try {
    await logAuditEvent({
      organizationId: existing.branch.organizationId,
      branchId: existing.branchId,
      userId,
      action: 'APPOINTMENT_PAYMENT_COMPLETED',
      details: { appointmentId, amount, transactionRef },
    });
  } catch (auditErr) {
    console.warn('Audit log error on payment:', auditErr);
  }

  try {
    // Customer notification
    await notificationService.createNotification({
      userId,
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'APPOINTMENT_PAYMENT_COMPLETED',
      title: 'Payment Received',
      message: `Payment of GHS ${amount.toFixed(2)} received. Your remote appointment is ready for processing.`,
      priority: 'INFO',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: { appointmentId, transactionRef, amount },
    });

    // Staff notification
    await notificationService.createNotification({
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'STAFF_APPOINTMENT_PAYMENT_RECEIVED',
      title: 'Appointment Payment Received',
      message: `Payment received for ${existing.service.name} (${existing.problemType || 'Service'}) by ${existing.user?.fullName || 'Customer'}. Ready to process.`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: { appointmentId, amount, customerName: existing.user?.fullName },
    });
  } catch (notifErr) {
    console.warn('Notification error on payment:', notifErr);
  }

  if (io) {
    io.to(`user_${userId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_PAID',
      appointment: updated,
    });
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_PAID',
      appointment: updated,
    });
  }

  return updated;
};

export const startAppointmentService = async (appointmentId: string, staffUser: any) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: true, service: true },
  });

  if (!existing) throw new Error('Appointment not found');

  const feeAmount = existing.fee !== null && existing.fee !== undefined ? Number(existing.fee) : null;
  const isFree = feeAmount === 0 || existing.isFollowUpCovered === true;

  if (isFree) {
    // Free appointments can be started directly from APPROVED (or PAID)
    if (existing.status !== AppointmentStatus.APPROVED && existing.status !== AppointmentStatus.PAID) {
      throw new Error(`Cannot start free service from status ${existing.status}. Expected status APPROVED or PAID.`);
    }
  } else {
    // Paid appointments strictly require payment before service can start
    if (existing.status !== AppointmentStatus.PAID) {
      throw new Error(
        `Cannot start service: payment of GHS ${feeAmount !== null ? feeAmount.toFixed(2) : 'fee'} is required before service can begin.`
      );
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
    include: {
      branch: { select: { id: true, name: true, location: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId: staffUser?.id,
    action: 'APPOINTMENT_STARTED',
    details: { appointmentId },
  });

  // Customer notification
  await notificationService.createNotification({
    userId: existing.userId,
    branchId: existing.branchId,
    organizationId: existing.branch.organizationId,
    type: 'APPOINTMENT_STARTED',
    title: 'Your appointment is now being served',
    message: `Staff has begun handling your remote request for ${existing.service.name}.`,
    priority: 'NORMAL',
    entityType: 'APPOINTMENT',
    entityId: appointmentId,
    metadata: { appointmentId, serviceName: existing.service.name },
  });

  if (io) {
    io.to(`user_${existing.userId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_STARTED',
      appointment: updated,
    });
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_STARTED',
      appointment: updated,
    });
  }

  return updated;
};

export const completeAppointmentService = async (appointmentId: string, staffUser: any) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: true, service: true },
  });

  if (!existing) throw new Error('Appointment not found');

  if (existing.status !== AppointmentStatus.IN_PROGRESS && existing.status !== AppointmentStatus.PAID) {
    throw new Error(`Cannot complete service from status ${existing.status}`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: AppointmentStatus.COMPLETED,
      completedAt: new Date(),
    },
    include: {
      branch: { select: { id: true, name: true, location: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId: staffUser?.id,
    action: 'APPOINTMENT_COMPLETED',
    details: { appointmentId },
  });

  // Customer notification requesting feedback
  await notificationService.createNotification({
    userId: existing.userId,
    branchId: existing.branchId,
    organizationId: existing.branch.organizationId,
    type: 'APPOINTMENT_COMPLETED',
    title: 'Your appointment has been completed',
    message: `Your remote service for ${existing.service.name} has been completed. Please let us know if your problem was solved.`,
    priority: 'NORMAL',
    entityType: 'APPOINTMENT',
    entityId: appointmentId,
    metadata: { appointmentId, serviceName: existing.service.name, requiresFeedback: true },
  });

  if (io) {
    io.to(`user_${existing.userId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_COMPLETED',
      appointment: updated,
    });
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_COMPLETED',
      appointment: updated,
    });
  }

  return updated;
};

export const submitAppointmentFeedback = async (
  appointmentId: string,
  userId: string,
  feedback: { isProblemSolved: boolean; feedbackNotes?: string }
) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: true, service: true },
  });

  if (!existing) throw new Error('Appointment not found');
  if (existing.userId !== userId) throw new Error('Unauthorized to submit feedback for this appointment');

  if (existing.status !== AppointmentStatus.COMPLETED) {
    throw new Error('Feedback can only be submitted for completed appointments');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      isProblemSolved: feedback.isProblemSolved,
      feedbackNotes: feedback.feedbackNotes || null,
    },
    include: {
      branch: { select: { id: true, name: true, location: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId,
    action: 'APPOINTMENT_FEEDBACK_SUBMITTED',
    details: {
      appointmentId,
      isProblemSolved: feedback.isProblemSolved,
      feedbackNotes: feedback.feedbackNotes,
    },
  });

  if (!feedback.isProblemSolved) {
    // Automatically set follow-up status to REQUESTED for staff attention
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        followUpStatus: 'REQUESTED',
        followUpNote: feedback.feedbackNotes || 'Customer marked problem not solved',
      },
    });

    await notificationService.createNotification({
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'STAFF_APPOINTMENT_UNSOLVED_FEEDBACK',
      title: 'Customer Feedback: Problem Not Solved',
      message: `Customer reported problem not solved for ${existing.service.name} (${existing.problemType || 'Service'}): "${feedback.feedbackNotes || 'No notes provided'}".`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: {
        appointmentId,
        feedbackNotes: feedback.feedbackNotes,
      },
    });
  }

  if (io) {
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_FEEDBACK_SUBMITTED',
      appointment: updated,
    });
  }

  return updated;
};

export const getBranchRemoteAppointments = async (branchId: string, status?: string) => {
  const where: any = { branchId };
  if (status && status !== 'ALL') {
    where.status = status as AppointmentStatus;
  }

  return await prisma.appointment.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      service: { select: { id: true, name: true, duration: true } },
      branch: { select: { id: true, name: true, location: true, organization: { select: { name: true } } } },
      category: { select: { id: true, name: true } },
      originalAppointment: { select: { id: true, problemType: true, status: true } },
      followUps: { select: { id: true, problemType: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getAppointmentById = async (id: string) => {
  return await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      service: { select: { id: true, name: true, duration: true } },
      branch: { select: { id: true, name: true, location: true, organization: { select: { id: true, name: true } } } },
      category: { select: { id: true, name: true } },
      originalAppointment: { select: { id: true, problemType: true, status: true, fee: true, paidAt: true } },
      followUps: { select: { id: true, problemType: true, status: true, fee: true, isFollowUpCovered: true, createdAt: true } },
    },
  });
};

/**
 * Customer requests follow-up review for an unsolved completed appointment.
 */
export const requestAppointmentFollowUp = async (
  appointmentId: string,
  userId: string,
  followUpNote?: string
) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: { include: { organization: true } }, service: true, user: true },
  });

  if (!existing) throw new Error('Appointment not found');
  if (existing.userId !== userId) throw new Error('Unauthorized: You can only request follow-up on your own appointment');

  if (existing.status !== AppointmentStatus.COMPLETED) {
    throw new Error('Follow-up can only be requested on completed appointments');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      followUpStatus: 'REQUESTED',
      followUpNote: followUpNote?.trim() || existing.feedbackNotes || 'Customer requested follow-up review',
    },
    include: {
      branch: { select: { id: true, name: true, location: true, organization: { select: { name: true } } } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, fullName: true, email: true } },
      category: { select: { id: true, name: true } },
      originalAppointment: true,
      followUps: true,
    },
  });

  await logAuditEvent({
    organizationId: existing.branch.organizationId,
    branchId: existing.branchId,
    userId,
    action: 'APPOINTMENT_FOLLOWUP_REQUESTED',
    details: { appointmentId, followUpNote },
  });

  // Notify branch staff
  await notificationService.createNotification({
    branchId: existing.branchId,
    organizationId: existing.branch.organizationId,
    type: 'STAFF_APPOINTMENT_FOLLOWUP_REQUESTED',
    title: 'Customer Requested Follow-Up',
    message: `${existing.user?.fullName || 'Customer'} requested follow-up for #${existing.id.slice(0, 8).toUpperCase()} (${existing.service.name}).`,
    priority: 'IMPORTANT',
    entityType: 'APPOINTMENT',
    entityId: appointmentId,
    metadata: {
      appointmentId,
      customerName: existing.user?.fullName,
      followUpNote: updated.followUpNote,
      serviceName: existing.service.name,
    },
  });

  if (io) {
    io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_FOLLOWUP_REQUESTED',
      appointment: updated,
    });
    io.to(`user_${userId}`).emit('appointment_updated', {
      type: 'APPOINTMENT_FOLLOWUP_REQUESTED',
      appointment: updated,
    });
  }

  return updated;
};

/**
 * Staff performs a follow-up action on an unsolved appointment:
 * - DIRECT_TO_BRANCH: Instructs customer to visit branch in person with appointment ID
 * - CREATE_FOLLOWUP_ATTEMPT: Creates a linked appointment covered by original payment
 * - MARK_RESOLVED: Marks the follow-up request handled
 */
export const staffAppointmentFollowUpAction = async (
  appointmentId: string,
  staffUser: any,
  payload: {
    action: 'DIRECT_TO_BRANCH' | 'CREATE_FOLLOWUP_ATTEMPT' | 'MARK_RESOLVED';
    instruction?: string;
  }
) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { branch: { include: { organization: true } }, service: true, user: true },
  });

  if (!existing) throw new Error('Appointment not found');

  if (existing.status !== AppointmentStatus.COMPLETED) {
    throw new Error('Follow-up actions can only be applied to completed appointments');
  }

  const instruction = payload.instruction?.trim() || '';

  if (payload.action === 'DIRECT_TO_BRANCH') {
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        followUpStatus: 'DIRECTED_TO_BRANCH',
        staffInstruction: instruction || 'This issue requires in-person verification. Please visit the branch with your appointment ID.',
      },
      include: {
        branch: { select: { id: true, name: true, location: true, organization: { select: { name: true } } } },
        service: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    await logAuditEvent({
      organizationId: existing.branch.organizationId,
      branchId: existing.branchId,
      userId: staffUser?.id,
      action: 'APPOINTMENT_FOLLOWUP_DIRECTED_TO_BRANCH',
      details: { appointmentId, instruction },
    });

    // Notify customer
    await notificationService.createNotification({
      userId: existing.userId,
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'APPOINTMENT_FOLLOWUP_DIRECTED',
      title: 'Branch Visit Required for Appointment',
      message: `Regarding your appointment #${existing.id.slice(0, 8).toUpperCase()}: ${instruction || 'This issue requires in-person verification. Please visit the branch with your appointment ID.'}`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: { appointmentId, instruction, branchName: existing.branch.name },
    });

    if (io) {
      io.to(`user_${existing.userId}`).emit('appointment_updated', {
        type: 'APPOINTMENT_FOLLOWUP_UPDATED',
        appointment: updated,
      });
      io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
        type: 'APPOINTMENT_FOLLOWUP_UPDATED',
        appointment: updated,
      });
    }

    return { appointment: updated, action: 'DIRECT_TO_BRANCH' };
  } else if (payload.action === 'CREATE_FOLLOWUP_ATTEMPT') {
    // Check if active follow-up attempt already exists
    const existingFollowUp = await prisma.appointment.findFirst({
      where: {
        originalAppointmentId: appointmentId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED, AppointmentStatus.IN_PROGRESS] },
      },
    });

    if (existingFollowUp) {
      throw new Error('An active follow-up service attempt already exists for this appointment.');
    }

    // Create linked follow-up appointment (Fee = 0, covered by original payment)
    const followUpAppointment = await prisma.appointment.create({
      data: {
        originalAppointmentId: appointmentId,
        userId: existing.userId,
        branchId: existing.branchId,
        serviceId: existing.serviceId,
        categoryId: existing.categoryId,
        problemType: existing.problemType,
        notes: `Follow-up to #${existing.id.slice(0, 8).toUpperCase()}: ${instruction || existing.feedbackNotes || 'Problem re-opened for second attempt'}`,
        status: AppointmentStatus.APPROVED, // Free & approved directly
        fee: 0,
        feeCurrency: existing.feeCurrency || 'GHS',
        isFollowUpCovered: true,
        approvedAt: new Date(),
        approvedBy: staffUser?.fullName || staffUser?.email || 'Staff Follow-up',
        scheduledTime: new Date(),
      },
      include: {
        branch: { select: { id: true, name: true, location: true, organization: { select: { name: true } } } },
        service: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    });

    const updatedOriginal = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        followUpStatus: 'IN_REVIEW',
        staffInstruction: instruction || 'Staff has initiated another remote resolution attempt at no additional cost.',
      },
    });

    await logAuditEvent({
      organizationId: existing.branch.organizationId,
      branchId: existing.branchId,
      userId: staffUser?.id,
      action: 'APPOINTMENT_FOLLOWUP_ATTEMPT_CREATED',
      details: { originalAppointmentId: appointmentId, newAppointmentId: followUpAppointment.id },
    });

    // Notify customer
    await notificationService.createNotification({
      userId: existing.userId,
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'APPOINTMENT_FOLLOWUP_CREATED',
      title: 'Follow-Up Service Scheduled (Covered)',
      message: `Staff has scheduled another remote attempt for your request #${existing.id.slice(0, 8).toUpperCase()} at no additional charge (Covered by original payment).`,
      priority: 'IMPORTANT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: {
        originalAppointmentId: appointmentId,
        followUpAppointmentId: followUpAppointment.id,
      },
    });

    if (io) {
      io.to(`user_${existing.userId}`).emit('appointment_updated', {
        type: 'APPOINTMENT_FOLLOWUP_CREATED',
        appointment: followUpAppointment,
        originalAppointment: updatedOriginal,
      });
      io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
        type: 'APPOINTMENT_FOLLOWUP_CREATED',
        appointment: followUpAppointment,
        originalAppointment: updatedOriginal,
      });
    }

    return { appointment: updatedOriginal, followUpAppointment, action: 'CREATE_FOLLOWUP_ATTEMPT' };
  } else if (payload.action === 'MARK_RESOLVED') {
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        followUpStatus: 'RESOLVED',
        staffInstruction: instruction || 'Staff marked follow-up as reviewed and handled.',
      },
      include: {
        branch: { select: { id: true, name: true, location: true, organization: { select: { name: true } } } },
        service: { select: { id: true, name: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logAuditEvent({
      organizationId: existing.branch.organizationId,
      branchId: existing.branchId,
      userId: staffUser?.id,
      action: 'APPOINTMENT_FOLLOWUP_RESOLVED',
      details: { appointmentId, instruction },
    });

    // Notify customer
    await notificationService.createNotification({
      userId: existing.userId,
      branchId: existing.branchId,
      organizationId: existing.branch.organizationId,
      type: 'APPOINTMENT_FOLLOWUP_RESOLVED',
      title: 'Follow-Up Handled',
      message: `Staff has addressed your follow-up for #${existing.id.slice(0, 8).toUpperCase()}.${instruction ? ' Staff note: ' + instruction : ''}`,
      priority: 'INFO',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: { appointmentId, instruction },
    });

    if (io) {
      io.to(`user_${existing.userId}`).emit('appointment_updated', {
        type: 'APPOINTMENT_FOLLOWUP_UPDATED',
        appointment: updated,
      });
      io.to(`branch_${existing.branchId}`).emit('appointment_updated', {
        type: 'APPOINTMENT_FOLLOWUP_UPDATED',
        appointment: updated,
      });
    }

    return { appointment: updated, action: 'MARK_RESOLVED' };
  } else {
    throw new Error('Invalid follow-up action');
  }
};   

/**
 * Customer hides an appointment from their personal activity history.
 * Preserves backend authoritative record for security and auditing.
 */
export const hideCustomerAppointment = async (appointmentId: string, userId: string) => {
  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!existing) throw new Error('Appointment not found');
  if (existing.userId !== userId) throw new Error('Unauthorized: You can only remove your own history records');

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      isCustomerHidden: true,
      customerHiddenAt: new Date(),
    },
  });
};

