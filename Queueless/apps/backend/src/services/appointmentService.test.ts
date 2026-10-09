import prisma from '../config/prisma';
import * as appointmentService from './appointmentService';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    branch: {
      findUnique: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    appointment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(async (callback: any) => await callback(mPrisma)),
  };
  return {
    __esModule: true,
    default: mPrisma,
  };
});

describe('appointmentService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an appointment', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    if (futureDate.getDay() === 0) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    futureDate.setHours(10, 0, 0, 0);

    const data = { userId: '1', branchId: 'b1', serviceId: 's1', scheduledTime: futureDate };
    const mockBranch = { id: 'b1', organizationId: 'o1', isActive: true };
    const mockService = { id: 's1', branchId: 'b1', isActive: true, duration: 15 };

    (prisma.branch.findUnique as jest.Mock).mockResolvedValue(mockBranch);
    (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
    (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.appointment.create as jest.Mock).mockResolvedValue({ id: 'a1', ...data });

    const result = await appointmentService.createAppointment(data);
    expect(result.id).toBe('a1');
    expect(prisma.appointment.create).toHaveBeenCalled();
  });

  it('should get user appointments', async () => {
    const userId = '1';
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([]);

    await appointmentService.getUserAppointments(userId);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId }),
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('should return available appointment slots', async () => {
    const mockBranch = { id: 'b1', isActive: true };
    const mockService = { id: 's1', isActive: true, duration: 30 };

    (prisma.branch.findUnique as jest.Mock).mockResolvedValue(mockBranch);
    (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);

    // Pick a future date that is not Sunday
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    if (futureDate.getDay() === 0) futureDate.setDate(futureDate.getDate() + 1);
    const dateStr = futureDate.toISOString().split('T')[0];

    const bookedTime = new Date(`${dateStr}T10:00:00.000Z`);
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
      { scheduledTime: bookedTime },
    ]);

    const slots = await appointmentService.getAvailableAppointmentSlots('b1', 's1', dateStr);

    expect(slots.length).toBeGreaterThan(0);
    const slot1000 = slots.find((s) => s.time === '10:00');
    expect(slot1000).toBeDefined();
    expect(slot1000?.available).toBe(false);
    expect(slot1000?.reason).toBe('Already booked');
  });

  it('should reschedule an appointment successfully', async () => {
    const existing = {
      id: 'a1',
      userId: 'user1',
      branchId: 'b1',
      serviceId: 's1',
      branch: { organizationId: 'o1', id: 'b1' },
      service: { duration: 15 },
    };

    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 2);
    newDate.setHours(11, 0, 0, 0);

    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null); // No conflict
    (prisma.appointment.update as jest.Mock).mockResolvedValue({
      ...existing,
      scheduledTime: newDate,
      status: 'CONFIRMED',
    });

    const result = await appointmentService.rescheduleAppointment('a1', newDate, 'user1');

    expect(result.status).toBe('CONFIRMED');
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a1' },
        data: expect.objectContaining({ scheduledTime: newDate }),
      })
    );
  });
});
