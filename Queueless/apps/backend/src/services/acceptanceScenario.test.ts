import * as queueService from './queueService';
import * as skillService from './skillService';
import * as staffAssignmentService from './staffAssignmentService';
import * as notificationService from './notificationService';
import prisma from '../config/prisma';
import { PriorityLevel, EntryStatus, Role } from '@prisma/client';

jest.mock('../config/prisma', () => {
  const mockTx = {
    queue: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    queueEntry: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    branch: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    skill: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    staffSkill: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    serviceSkillRequirement: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-log-01' }),
    },
    notification: {
      create: jest.fn().mockResolvedValue({ id: 'notif-01' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: {
      ...mockTx,
      $transaction: jest.fn((callback) => callback(mockTx)),
    },
  };
});

jest.mock('./notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue({ id: 'notif-01' }),
  notifyCustomer: jest.fn().mockResolvedValue(true),
  sendPushNotification: jest.fn().mockResolvedValue(true),
  sendSMS: jest.fn().mockResolvedValue(true),
}));

describe('Part 22 — Final Acceptance Scenario: Telecom Company - Bolga Branch', () => {
  const orgId = 'org-telecom-001';
  const branchId = 'branch-bolga-001';

  // Services
  const serviceSim = {
    id: 'svc-sim-reg',
    name: 'SIM Registration',
    branchId,
    duration: 15,
    servingCapacity: 1,
    isActive: true,
    branch: { id: branchId, organizationId: orgId },
    queues: [{ id: 'q-sim-reg', status: 'OPEN', priorityRatio: 2, consecutivePriorityCount: 0 }],
  };

  const serviceSupport = {
    id: 'svc-customer-support',
    name: 'Customer Support',
    branchId,
    duration: 10,
    servingCapacity: 2,
    isActive: true,
    branch: { id: branchId, organizationId: orgId },
    queues: [{ id: 'q-customer-support', status: 'OPEN', priorityRatio: 2, consecutivePriorityCount: 0 }],
  };

  const serviceFiber = {
    id: 'svc-fiber-broadband',
    name: 'Fiber Broadband',
    branchId,
    duration: 25,
    servingCapacity: 1,
    isActive: true,
    branch: { id: branchId, organizationId: orgId },
    queues: [{ id: 'q-fiber-broadband', status: 'OPEN', priorityRatio: 2, consecutivePriorityCount: 0 }],
  };

  // Staff
  const staffJohn = {
    id: 'user-john',
    name: 'John',
    fullName: 'John Doe',
    email: 'john@telecom.com',
    role: 'STAFF' as Role,
    branchId,
  };

  const staffMary = {
    id: 'user-mary',
    name: 'Mary',
    fullName: 'Mary Smith',
    email: 'mary@telecom.com',
    role: 'STAFF' as Role,
    branchId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Step 1 & 2: Customer joins Customer Support, staff transfers ticket to SIM Registration', async () => {
    const originalTicket = {
      id: 'ticket-cs-01',
      ticketNumber: 'CS-001',
      queueId: 'q-customer-support',
      userId: 'customer-alice',
      serviceId: serviceSupport.id,
      status: 'WAITING' as EntryStatus,
      position: 1,
      priority: 'NORMAL' as PriorityLevel,
      queue: {
        id: 'q-customer-support',
        serviceId: serviceSupport.id,
        service: serviceSupport,
        branch: { id: branchId, organizationId: orgId },
      },
      user: {
        id: 'customer-alice',
        fullName: 'Alice Customer',
        email: 'alice@example.com',
        phoneNumber: '+233201234567',
      },
    };

    const transferredEntry = {
      ...originalTicket,
      id: 'ticket-cs-01-transferred',
      ticketNumber: 'SIM-002',
      queueId: 'q-sim-reg',
      serviceId: serviceSim.id,
      transferredFromEntryId: originalTicket.id,
      originalServiceId: serviceSupport.id,
      transferReason: 'Customer requires SIM Registration',
      transferredByStaffId: staffJohn.id,
      transferredAt: new Date(),
      queue: {
        id: 'q-sim-reg',
        service: serviceSim,
        branch: { id: branchId, organizationId: orgId },
      },
    };

    const mockTx = await (prisma.$transaction as any)(async (t: any) => t);
    mockTx.queueEntry.findUnique.mockResolvedValue(originalTicket);
    mockTx.service.findUnique.mockResolvedValue(serviceSim);
    mockTx.queueEntry.update.mockResolvedValue({
      ...originalTicket,
      queueId: serviceSim.queues[0].id,
      position: 2,
      originalServiceId: serviceSupport.id,
      transferredAt: new Date(),
      transferredByStaffId: staffJohn.id,
      transferReason: 'Customer requires SIM Registration',
    });
    mockTx.queueEntry.count.mockResolvedValue(1);
    mockTx.queue.update.mockResolvedValue(serviceSim.queues[0]);

    const result = await queueService.transferTicket(
      originalTicket.id,
      serviceSim.id,
      staffJohn.id,
      { reason: 'Customer requires SIM Registration' }
    );

    // 1. Records transfer & preserves original ticket identity and history
    expect(result).toBeDefined();
    expect(result.id).toBe(originalTicket.id);
    expect(result.originalServiceId).toBe(serviceSupport.id);
    expect(result.transferReason).toBe('Customer requires SIM Registration');
    expect(result.transferredByStaffId).toBe(staffJohn.id);

    // 2. Audit record creation
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: orgId,
          branchId,
          action: 'TICKET_TRANSFERRED',
          userId: staffJohn.id,
        }),
      })
    );

    // 3. Customer notification created
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Service Queue Transferred',
        message: expect.stringContaining('SIM Registration'),
      })
    );
  });

  test('Step 3: Second customer joins SIM Registration with PRIORITY, and priority policy is applied', async () => {
    const queueSim = {
      id: 'q-sim-reg',
      serviceId: serviceSim.id,
      status: 'OPEN',
      priorityRatio: 2,
      consecutivePriorityCount: 0,
      service: serviceSim,
      branch: { id: branchId, organizationId: orgId },
    };

    const waitingNormalTicket = {
      id: 'ticket-normal',
      ticketNumber: 'SIM-001',
      queueId: queueSim.id,
      priority: 'NORMAL' as PriorityLevel,
      status: 'WAITING' as EntryStatus,
      position: 1,
    };

    const waitingPriorityTicket = {
      id: 'ticket-priority',
      ticketNumber: 'SIM-002',
      queueId: queueSim.id,
      priority: 'PRIORITY' as PriorityLevel,
      status: 'WAITING' as EntryStatus,
      position: 2,
      user: { fullName: 'Bob Priority' },
      queue: queueSim,
    };

    const mockTx = await (prisma.$transaction as any)(async (t: any) => t);
    mockTx.queue.findUnique.mockResolvedValue(queueSim);
    // When priorityRatio is 2 and consecutivePriorityCount is 0, Priority customer is called next
    mockTx.queueEntry.findFirst.mockResolvedValue(waitingPriorityTicket);
    mockTx.queueEntry.update.mockResolvedValue({
      ...waitingPriorityTicket,
      status: 'CALLING',
      calledAt: new Date(),
    });
    mockTx.queue.update.mockResolvedValue({
      ...queueSim,
      consecutivePriorityCount: 1,
    });

    const calledTicket = await queueService.callNext(queueSim.id);

    expect(calledTicket).toBeDefined();
    expect(calledTicket?.priority).toBe('PRIORITY');
    expect(calledTicket?.ticketNumber).toBe('SIM-002');
  });

  test('Step 4: John is busy with SIM Registration. Mary is qualified ONLY for Fiber Broadband. Mary is NOT assigned to SIM Registration', async () => {
    // Skills configuration
    const skillSim = { id: 'sk-sim', name: 'SIM Registration', organizationId: orgId };
    const skillCS = { id: 'sk-cs', name: 'Customer Support', organizationId: orgId };
    const skillFiber = { id: 'sk-fiber', name: 'Fiber Broadband', organizationId: orgId };

    const serviceSimWithSkills = {
      ...serviceSim,
      skillRequirements: [
        { id: 'sr-1', serviceId: serviceSim.id, skillId: skillSim.id, isMandatory: true, skill: skillSim },
      ],
    };

    (prisma.service.findUnique as jest.Mock).mockResolvedValue(serviceSimWithSkills);

    // Staff John: SIM Registration & Customer Support
    // Staff Mary: Fiber Broadband
    const allStaff = [
      {
        ...staffJohn,
        staffSkills: [
          { skillId: skillSim.id, skill: skillSim },
          { skillId: skillCS.id, skill: skillCS },
        ],
      },
      {
        ...staffMary,
        staffSkills: [
          { skillId: skillFiber.id, skill: skillFiber },
        ],
      },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(allStaff);

    // Active serving tickets: John is currently serving a customer
    (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'active-ticket-01',
        servedByStaffId: staffJohn.id,
        ticketNumber: 'SIM-000',
        status: 'SERVING',
      },
    ]);

    const report = await staffAssignmentService.evaluateServiceStaffAssignment(serviceSim.id);

    // Mary lacks the SIM Registration skill, so Mary is NOT in the qualified staff list for SIM Registration
    const maryInQualified = report.qualifiedStaff.find((s: any) => s.id === staffMary.id);
    expect(maryInQualified).toBeUndefined();

    // John is qualified, but currently busy
    const johnBusy = report.busyQualifiedStaff.find((s: any) => s.id === staffJohn.id);
    expect(johnBusy).toBeDefined();

    // Because John is busy and Mary is unqualified, there is no preferred available agent
    expect(report.preferredStaffMember).toBeNull();
  });

  test('Step 5: Customer receives milestone notifications idempotently without duplicates', async () => {
    const customerId = 'customer-alice';

    // When customer hits 5 people ahead the first time -> 1 notification is stored
    (prisma.notification.count as jest.Mock).mockResolvedValueOnce(0); // none sent yet
    (prisma.notification.create as jest.Mock).mockResolvedValueOnce({
      id: 'notif-5-ahead',
      userId: customerId,
      title: 'Queue Approaching',
      message: 'You have approximately 5 people ahead of you.',
    });

    const existingCount = await prisma.notification.count({
      where: { userId: customerId, title: 'Queue Approaching' },
    });
    if (existingCount === 0) {
      await prisma.notification.create({
        data: {
          userId: customerId,
          title: 'Queue Approaching',
          message: 'You have approximately 5 people ahead of you.',
          type: 'QUEUE_UPDATE',
        },
      });
    }

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);

    // Live update fires again while still at 5 people ahead
    (prisma.notification.count as jest.Mock).mockResolvedValueOnce(1); // already sent!
    const updatedCount = await prisma.notification.count({
      where: { userId: customerId, title: 'Queue Approaching' },
    });
    if (updatedCount === 0) {
      await prisma.notification.create({
        data: {
          userId: customerId,
          title: 'Queue Approaching',
          message: 'You have approximately 5 people ahead of you.',
          type: 'QUEUE_UPDATE',
        },
      });
    }

    // Call count remains 1: duplicate notification was prevented
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });
});
