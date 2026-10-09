import * as queueService from './queueService';
import * as skillService from './skillService';
import * as staffAssignmentService from './staffAssignmentService';
import prisma from '../config/prisma';
import { EntryStatus, PriorityLevel, NotificationPreference, Role } from '@prisma/client';

// Mock dependencies
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
      update: jest.fn(),
    },
    skill: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    staffSkill: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    serviceSkillRequirement: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: {
      ...mockTx,
      $transaction: jest.fn((callback) => callback(mockTx)),
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      branch: {
        findUnique: jest.fn(),
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
      },
    },
  };
});

jest.mock('../index', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
}));

describe('Advanced Queue Operations - Competitive Upgrade Phase 1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // PART 1: SERVICE TRANSFER
  // ==========================================
  describe('Part 1: Service Transfer', () => {
    it('should successfully transfer a ticket to another service in the same branch, preserving ticket identity', async () => {
      const mockSourceEntry = {
        id: 'ticket-101',
        ticketNumber: 'CS-005',
        userId: 'user-cust-1',
        queueId: 'queue-cs',
        status: EntryStatus.WAITING,
        position: 3,
        queue: {
          id: 'queue-cs',
          serviceId: 'svc-cs',
          branchId: 'branch-bolga',
          service: { id: 'svc-cs', name: 'Customer Support' },
          branch: { id: 'branch-bolga', organizationId: 'org-telecom', name: 'Bolga Branch' },
        },
        user: { id: 'user-cust-1', fullName: 'Kwame Mensah', email: 'kwame@example.com', phoneNumber: '+233200000001' },
      };

      const mockDestService = {
        id: 'svc-sim',
        name: 'SIM Registration',
        branchId: 'branch-bolga',
        isActive: true,
        branch: { id: 'branch-bolga', organizationId: 'org-telecom', name: 'Bolga Branch' },
        queues: [{ id: 'queue-sim', status: 'OPEN' }],
      };

      const tx = (prisma.$transaction as jest.Mock).mock.calls[0] ? undefined : undefined;
      // Setup mock returns on transaction mock
      const mockPrismaTx = await (prisma.$transaction as any)(async (t: any) => t);
      mockPrismaTx.queueEntry.findUnique.mockResolvedValue(mockSourceEntry);
      mockPrismaTx.service.findUnique.mockResolvedValue(mockDestService);
      mockPrismaTx.queueEntry.findFirst.mockResolvedValue({ position: 7 }); // last entry in destination is at position 7
      mockPrismaTx.queueEntry.update.mockResolvedValue({
        ...mockSourceEntry,
        queueId: 'queue-sim',
        position: 8,
        originalServiceId: 'svc-cs',
        transferredAt: new Date(),
        transferredByStaffId: 'staff-john',
        transferReason: 'Wrong service selected',
        queue: {
          service: { id: 'svc-sim', name: 'SIM Registration' },
          branch: mockSourceEntry.queue.branch,
        },
      });

      const result = await queueService.transferTicket(
        'ticket-101',
        'svc-sim',
        'staff-john',
        { reason: 'Wrong service selected' }
      );

      expect(result.id).toBe('ticket-101'); // Preserves original ticket identity
      expect(result.queueId).toBe('queue-sim'); // Moved to destination queue
      expect(result.position).toBe(8); // Placed at next position in line
      expect(result.originalServiceId).toBe('svc-cs');
      expect(result.transferReason).toBe('Wrong service selected');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TICKET_TRANSFERRED',
            organizationId: 'org-telecom',
            branchId: 'branch-bolga',
            userId: 'staff-john',
          }),
        })
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-cust-1',
            type: 'QUEUE_TRANSFERRED',
            title: 'Service Queue Transferred',
          }),
        })
      );
    });

    it('should reject transfer when destination service belongs to another organization (multi-tenant boundary)', async () => {
      const mockSourceEntry = {
        id: 'ticket-102',
        ticketNumber: 'CS-006',
        userId: 'user-cust-2',
        queueId: 'queue-cs',
        status: EntryStatus.WAITING,
        queue: {
          id: 'queue-cs',
          serviceId: 'svc-cs',
          branchId: 'branch-bolga',
          service: { id: 'svc-cs', name: 'Customer Support' },
          branch: { id: 'branch-bolga', organizationId: 'org-telecom' },
        },
      };

      const mockDestServiceAlienOrg = {
        id: 'svc-alien',
        name: 'Competitor Service',
        branchId: 'branch-alien',
        isActive: true,
        branch: { id: 'branch-alien', organizationId: 'org-COMPETITOR' }, // DIFFERENT TENANT
        queues: [{ id: 'queue-alien', status: 'OPEN' }],
      };

      const mockPrismaTx = await (prisma.$transaction as any)(async (t: any) => t);
      mockPrismaTx.queueEntry.findUnique.mockResolvedValue(mockSourceEntry);
      mockPrismaTx.service.findUnique.mockResolvedValue(mockDestServiceAlienOrg);

      await expect(
        queueService.transferTicket('ticket-102', 'svc-alien', 'staff-john', { reason: 'Wrong service' })
      ).rejects.toThrow('Security Error: Cross-organization service transfer is not permitted');
    });

    it('should reject transfer when destination service is inactive', async () => {
      const mockSourceEntry = {
        id: 'ticket-103',
        queue: {
          id: 'queue-cs',
          service: { id: 'svc-cs', name: 'Customer Support' },
          branch: { id: 'branch-bolga', organizationId: 'org-telecom' },
        },
      };

      const mockInactiveService = {
        id: 'svc-inactive',
        name: 'Deprecated Service',
        branchId: 'branch-bolga',
        isActive: false, // INACTIVE
        branch: { id: 'branch-bolga', organizationId: 'org-telecom' },
      };

      const mockPrismaTx = await (prisma.$transaction as any)(async (t: any) => t);
      mockPrismaTx.queueEntry.findUnique.mockResolvedValue(mockSourceEntry);
      mockPrismaTx.service.findUnique.mockResolvedValue(mockInactiveService);

      await expect(
        queueService.transferTicket('ticket-103', 'svc-inactive', 'staff-john', { reason: 'Referral' })
      ).rejects.toThrow('currently inactive');
    });

    it('should reject transfer when destination queue is closed', async () => {
      const mockSourceEntry = {
        id: 'ticket-104',
        queue: {
          id: 'queue-cs',
          service: { id: 'svc-cs', name: 'Customer Support' },
          branch: { id: 'branch-bolga', organizationId: 'org-telecom' },
        },
      };

      const mockClosedQueueService = {
        id: 'svc-closed',
        name: 'Night Support',
        branchId: 'branch-bolga',
        isActive: true,
        branch: { id: 'branch-bolga', organizationId: 'org-telecom' },
        queues: [{ id: 'queue-closed', status: 'CLOSED' }], // CLOSED
      };

      const mockPrismaTx = await (prisma.$transaction as any)(async (t: any) => t);
      mockPrismaTx.queueEntry.findUnique.mockResolvedValue(mockSourceEntry);
      mockPrismaTx.service.findUnique.mockResolvedValue(mockClosedQueueService);

      await expect(
        queueService.transferTicket('ticket-104', 'svc-closed', 'staff-john', { reason: 'Referral' })
      ).rejects.toThrow('currently closed');
    });
  });

  // ==========================================
  // PART 2: PRIORITY QUEUE SYSTEM & FAIRNESS
  // ==========================================
  describe('Part 2: Priority Queue System & Anti-Starvation', () => {
    it('should assign and update priority with full audit event', async () => {
      const mockEntry = {
        id: 'ticket-201',
        ticketNumber: 'SIM-001',
        priority: PriorityLevel.NORMAL,
        queueId: 'q-sim',
        queue: {
          branch: { id: 'b-1', organizationId: 'org-1' },
          service: { name: 'SIM Registration' },
        },
        user: { fullName: 'Amina' },
      };

      (prisma.queueEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.queueEntry.update as jest.Mock).mockResolvedValue({
        ...mockEntry,
        priority: PriorityLevel.PRIORITY,
      });

      const updated = await queueService.updateTicketPriority(
        'ticket-201',
        PriorityLevel.PRIORITY,
        'staff-1',
        'Senior citizen priority'
      );

      expect(updated.priority).toBe(PriorityLevel.PRIORITY);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TICKET_PRIORITY_CHANGED',
            organizationId: 'org-1',
            userId: 'staff-1',
          }),
        })
      );
    });

    it('should serve priority customer before normal customer when starvation ratio is not exceeded', async () => {
      const mockQueue = {
        id: 'q-priority',
        priorityRatio: 2,
        consecutivePriorityCount: 0, // Has served 0 priority customers consecutively
        branch: { organizationId: 'org-1', id: 'b-1' },
      };

      const mockPriorityCustomer = {
        id: 'ticket-p1',
        ticketNumber: 'SIM-P01',
        priority: PriorityLevel.PRIORITY,
        position: 5,
        user: { fullName: 'VIP Customer' },
      };

      const mockPrismaTx = await (prisma.$transaction as any)(async (t: any) => t);
      mockPrismaTx.queue.findUnique.mockResolvedValue(mockQueue);
      // Priority search returns VIP Customer
      mockPrismaTx.queueEntry.findFirst.mockResolvedValue(mockPriorityCustomer);
      mockPrismaTx.queueEntry.update.mockResolvedValue({
        ...mockPriorityCustomer,
        status: EntryStatus.CALLING,
        calledAt: new Date(),
        queue: { service: { name: 'SIM Registration' } },
      });

      const called = await queueService.callNext('q-priority', 'staff-1');

      expect(called?.id).toBe('ticket-p1');
      // Consecutive priority counter updated to 1
      expect(mockPrismaTx.queue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-priority' },
          data: { consecutivePriorityCount: 1 },
        })
      );
    });

    it('should enforce anti-starvation policy: serve normal customer when consecutive priority limit reached', async () => {
      const mockQueue = {
        id: 'q-starvation-test',
        priorityRatio: 2,
        consecutivePriorityCount: 2, // ALREADY SERVED 2 PRIORITY CUSTOMERS IN A ROW!
        branch: { organizationId: 'org-1', id: 'b-1' },
      };

      const mockNormalCustomer = {
        id: 'ticket-normal-oldest',
        ticketNumber: 'SIM-N01',
        priority: PriorityLevel.NORMAL,
        position: 1,
        user: { fullName: 'Patient Normal Customer' },
      };

      const mockPrismaTx = await (prisma.$transaction as any)(async (t: any) => t);
      mockPrismaTx.queue.findUnique.mockResolvedValue(mockQueue);
      // Starvation check finds the waiting normal customer
      mockPrismaTx.queueEntry.findFirst.mockResolvedValue(mockNormalCustomer);
      mockPrismaTx.queueEntry.update.mockResolvedValue({
        ...mockNormalCustomer,
        status: EntryStatus.CALLING,
        queue: { service: { name: 'SIM Registration' } },
      });

      const called = await queueService.callNext('q-starvation-test', 'staff-1');

      expect(called?.id).toBe('ticket-normal-oldest');
      // Counter reset to 0 to prevent starving normal customers
      expect(mockPrismaTx.queue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-starvation-test' },
          data: { consecutivePriorityCount: 0 },
        })
      );
    });
  });

  // ==========================================
  // PART 3 & 4: STAFF SKILLS & INTELLIGENT ASSIGNMENT
  // ==========================================
  describe('Part 3 & 4: Staff Skills and Deterministic Assignment', () => {
    it('should create organization skill with duplicate prevention and audit trail', async () => {
      (prisma.skill.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.skill.create as jest.Mock).mockResolvedValue({
        id: 'skill-sim',
        organizationId: 'org-telecom',
        name: 'SIM Registration',
      });

      const skill = await skillService.createSkill(
        'org-telecom',
        { name: 'SIM Registration', description: 'Handles SIM activation and KYC' },
        'admin-user'
      );

      expect(skill.name).toBe('SIM Registration');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SKILL_CREATED',
            organizationId: 'org-telecom',
          }),
        })
      );
    });

    it('should deterministically assign John to SIM Registration and Mary only to Fiber Broadband', async () => {
      // Scenario setup:
      // SIM Registration requires 'skill-sim'
      const mockSimService = {
        id: 'svc-sim-reg',
        name: 'SIM Registration',
        branchId: 'branch-bolga',
        branch: { id: 'branch-bolga', name: 'Bolga Branch' },
        skillRequirements: [
          { skillId: 'skill-sim', skill: { id: 'skill-sim', name: 'SIM Registration' } },
        ],
      };

      // Staff in Bolga Branch:
      // John has 'skill-sim' and 'skill-cs'
      // Mary has only 'skill-fiber'
      const mockBranchStaff = [
        {
          id: 'staff-john',
          fullName: 'John',
          email: 'john@telecom.com',
          role: Role.STAFF,
          staffBranchId: 'branch-bolga',
          staffSkills: [
            { skillId: 'skill-sim', skill: { id: 'skill-sim', name: 'SIM Registration' } },
            { skillId: 'skill-cs', skill: { id: 'skill-cs', name: 'Customer Support' } },
          ],
        },
        {
          id: 'staff-mary',
          fullName: 'Mary',
          email: 'mary@telecom.com',
          role: Role.STAFF,
          staffBranchId: 'branch-bolga',
          staffSkills: [
            { skillId: 'skill-fiber', skill: { id: 'skill-fiber', name: 'Fiber Broadband' } },
          ],
        },
      ];

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockSimService);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockBranchStaff);
      // Neither is currently serving
      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([]);

      const report = await staffAssignmentService.evaluateServiceStaffAssignment('svc-sim-reg');

      // John is qualified for SIM Registration
      expect(report.qualifiedStaff.some((s) => s.id === 'staff-john')).toBe(true);
      // Mary is NOT qualified for SIM Registration
      expect(report.qualifiedStaff.some((s) => s.id === 'staff-mary')).toBe(false);
      // Preferred available agent is John
      expect(report.preferredStaffMember?.id).toBe('staff-john');
    });

    it('should prefer idle qualified staff over busy qualified staff', async () => {
      const mockSupportService = {
        id: 'svc-cs-general',
        name: 'Customer Support',
        branchId: 'branch-bolga',
        branch: { id: 'branch-bolga', name: 'Bolga Branch' },
        skillRequirements: [], // Open to all branch staff
      };

      const mockBranchStaff = [
        {
          id: 'staff-john',
          fullName: 'John',
          email: 'john@telecom.com',
          role: Role.STAFF,
          staffBranchId: 'branch-bolga',
          staffSkills: [],
        },
        {
          id: 'staff-alex',
          fullName: 'Alex',
          email: 'alex@telecom.com',
          role: Role.STAFF,
          staffBranchId: 'branch-bolga',
          staffSkills: [],
        },
      ];

      (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockSupportService);
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockBranchStaff);
      // John is busy serving ticket CS-001
      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        { servedByStaffId: 'staff-john', ticketNumber: 'CS-001', status: EntryStatus.SERVING },
      ]);

      const report = await staffAssignmentService.evaluateServiceStaffAssignment('svc-cs-general');

      expect(report.busyQualifiedStaff.some((s) => s.id === 'staff-john')).toBe(true);
      expect(report.idleQualifiedStaff.some((s) => s.id === 'staff-alex')).toBe(true);
      // Alex is idle, so Alex is the preferred agent!
      expect(report.preferredStaffMember?.id).toBe('staff-alex');
    });
  });

  // ==========================================
  // PART 5 & 12: NOTIFICATION PREFERENCES & DEDUPLICATION
  // ==========================================
  describe('Part 5 & 12: Notification Preferences & Idempotency', () => {
    it('should respect NOTIFY_CALLED_ONLY preference: skip milestone 2 and 5 notifications', async () => {
      const mockQueueEntries = [
        {
          id: 'entry-quiet',
          userId: 'user-quiet',
          position: 1, // 0 people ahead
          ticketNumber: 'T-001',
          notificationPreference: NotificationPreference.NOTIFY_CALLED_ONLY,
          queue: {
            branchId: 'b-1',
            branch: { organizationId: 'org-1' },
            service: { name: 'Express' },
          },
        },
      ];

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(mockQueueEntries);

      await queueService.notifyQueueMilestones('queue-test');

      // Zero milestone notifications should be sent to this user
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should guarantee milestone notification idempotency (never duplicate 5-ahead or 2-ahead notifications)', async () => {
      const mockWaitingEntries = [
        {
          id: 'entry-norm',
          userId: 'user-norm',
          position: 2,
          ticketNumber: 'T-002',
          notificationPreference: NotificationPreference.STANDARD,
          queue: {
            branchId: 'b-1',
            branch: { organizationId: 'org-1' },
            service: { name: 'Support' },
          },
        },
      ];

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(mockWaitingEntries);
      // Mock that QUEUE_MILESTONE_2 was ALREADY SENT in the past
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 'user-norm',
          type: 'QUEUE_MILESTONE_2',
          metadata: { ticketId: 'entry-norm' },
        },
      ]);

      await queueService.notifyQueueMilestones('queue-test');

      // Because hasMilestoneBeenNotified returned true, no duplicate notification is created
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // PART 14: MULTI-TENANT SECURITY
  // ==========================================
  describe('Part 14: Multi-Tenant Security Isolation', () => {
    it('should reject skill assignment across different organizations', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'staff-foreign',
        organizationId: 'org-FOREIGN',
      });

      await expect(
        skillService.assignSkillToStaff('staff-foreign', 'skill-local', 'admin-1', 'org-LOCAL')
      ).rejects.toThrow('Security Error: Staff user does not belong to this organization');
    });

    it('should reject deleting skills belonging to another organization', async () => {
      (prisma.skill.findUnique as jest.Mock).mockResolvedValue({
        id: 'skill-foreign',
        organizationId: 'org-FOREIGN',
      });

      await expect(
        skillService.deleteSkill('skill-foreign', 'org-LOCAL', 'admin-1')
      ).rejects.toThrow('Security Error: Skill does not belong to this organization');
    });
  });
});
