import prisma from '../config/prisma';
import * as queueService from './queueService';
import * as queueController from '../controllers/queueController';
import * as qrController from '../controllers/qrController';
import * as userController from '../controllers/userController';
import * as userService from './userService';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    branch: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    queue: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    queueEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    qRCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(async (cb: any) => await cb(mPrisma)),
  };
  return {
    __esModule: true,
    default: mPrisma,
  };
});

jest.mock('../index', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
}));

describe('Phase 2.6: Service Queue Controls, QR Lifecycle & Customer Profile', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Service Queue Opening and Closing', () => {
    it('should allow staff to close a specific service queue, logging audit and emitting socket event', async () => {
      const mockQueue = {
        id: 'q-sim',
        serviceId: 'svc-sim',
        branchId: 'b-main',
        status: 'OPEN',
        service: { name: 'SIM Registration' },
        branch: { organizationId: 'org-telco' },
      };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queue.update as jest.Mock).mockResolvedValue({
        ...mockQueue,
        status: 'CLOSED',
      });

      const updated = await queueService.updateQueueStatus('q-sim', 'CLOSED', 'staff-user-1');

      expect(updated.status).toBe('CLOSED');
      expect(prisma.queue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-sim' },
          data: expect.objectContaining({ status: 'CLOSED' }),
        })
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SERVICE_QUEUE_CLOSED',
            branchId: 'b-main',
            userId: 'staff-user-1',
          }),
        })
      );
    });

    it('should allow staff to open a specific service queue, logging audit and emitting socket event', async () => {
      const mockQueue = {
        id: 'q-sim',
        serviceId: 'svc-sim',
        branchId: 'b-main',
        status: 'CLOSED',
        service: { name: 'SIM Registration' },
        branch: { organizationId: 'org-telco' },
      };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queue.update as jest.Mock).mockResolvedValue({
        ...mockQueue,
        status: 'OPEN',
      });

      const updated = await queueService.updateQueueStatus('q-sim', 'OPEN', 'staff-user-1');

      expect(updated.status).toBe('OPEN');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SERVICE_QUEUE_OPENED',
          }),
        })
      );
    });

    it('should reject new joins when queue is CLOSED with the required user-facing message', async () => {
      (prisma.queue.findUnique as jest.Mock).mockResolvedValue({
        id: 'q-diagnosis',
        status: 'CLOSED',
        branch: { operatingHours: '08:00 - 17:00', organizationId: 'org-1' },
        service: { name: 'Smartphone Diagnosis' },
      });

      await expect(
        queueService.joinQueue('q-diagnosis', 'customer-1')
      ).rejects.toThrow(
        'Queue Currently Closed: Smartphone Diagnosis is not accepting new customers right now. Existing customers are still being served. Please try again later.'
      );
    });

    it('should allow existing customers to be called and served even after queue is CLOSED', async () => {
      // Mock calling next ticket on a closed queue
      const mockEntry = {
        id: 'entry-waiting',
        queueId: 'q-sim',
        userId: 'cust-1',
        status: 'WAITING',
        position: 1,
        ticketNumber: 'SIM-001',
        queue: {
          id: 'q-sim',
          status: 'CLOSED', // Queue closed for new entries
          service: { name: 'SIM Registration' },
        },
      };

      (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.queueEntry.update as jest.Mock).mockResolvedValue({
        ...mockEntry,
        status: 'CALLING',
      });
      (prisma.queue.findUnique as jest.Mock).mockResolvedValue({
        id: 'q-sim',
        status: 'CLOSED',
        branch: { organizationId: 'org-1' },
      });

      const called = await queueService.callNext('q-sim', 'staff-1');
      expect(called).not.toBeNull();
      expect(called!.status).toBe('CALLING');
      expect(called!.ticketNumber).toBe('SIM-001');
    });
  });

  describe('2. Service-Specific QR Lifecycle', () => {
    it('should enforce serviceId requirement when generating QR codes', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Org 1' },
      });

      const req: any = {
        params: { branchId: 'branch-1' },
        body: { type: 'BRANCH' }, // Missing required serviceId
        user: { id: 'staff-1', role: 'SUPER_ADMIN' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.generateBranchQr(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('serviceId is required') })
      );
    });

    it('should resolve active QR on an OPEN queue returning isQueueOpen: true', async () => {
      const mockQr = {
        id: 'qr-sim-1',
        token: 'SIM-9921',
        type: 'SERVICE',
        status: 'ACTIVE',
        serviceId: 'svc-sim',
        branchId: 'branch-1',
        organizationId: 'org-1',
        expiresAt: new Date(Date.now() + 86400000),
        service: {
          id: 'svc-sim',
          name: 'SIM Registration',
          duration: 10,
          price: 0,
          isActive: true,
          allowRemoteJoin: true,
          queues: [{ id: 'q-sim', status: 'OPEN' }],
        },
        branch: { id: 'branch-1', name: 'Downtown Branch', location: '123 Main', isActive: true },
        organization: { id: 'org-1', name: 'Telecom Inc' },
      };

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockQr);

      const req: any = { params: { code: 'SIM-9921' } };
      const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await qrController.resolveQr(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SERVICE',
          service: expect.objectContaining({
            id: 'svc-sim',
            isQueueOpen: true,
            queueId: 'q-sim',
          }),
        })
      );
    });

    it('should resolve active QR on a CLOSED queue returning isQueueOpen: false', async () => {
      const mockQr = {
        id: 'qr-sim-2',
        token: 'SIM-9922',
        type: 'SERVICE',
        status: 'ACTIVE',
        serviceId: 'svc-sim',
        branchId: 'branch-1',
        organizationId: 'org-1',
        expiresAt: new Date(Date.now() + 86400000),
        service: {
          id: 'svc-sim',
          name: 'SIM Registration',
          duration: 10,
          price: 0,
          isActive: true,
          allowRemoteJoin: true,
          queues: [{ id: 'q-sim', status: 'CLOSED' }],
        },
        branch: { id: 'branch-1', name: 'Downtown Branch', location: '123 Main', isActive: true },
        organization: { id: 'org-1', name: 'Telecom Inc' },
      };

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockQr);

      const req: any = { params: { code: 'SIM-9922' } };
      const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await qrController.resolveQr(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SERVICE',
          service: expect.objectContaining({
            isQueueOpen: false,
            queueId: 'q-sim',
          }),
        })
      );
    });

    it('should reject a revoked QR code with the required message', async () => {
      const mockQr = {
        id: 'qr-revoked',
        token: 'SIM-REVOKED',
        status: 'REVOKED',
        branch: { id: 'branch-1', isActive: true },
      };

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockQr);

      const req: any = { params: { code: 'SIM-REVOKED' } };
      const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await qrController.resolveQr(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'This QR code has been closed by the organization. Please use the QueueLess app or scan a current QR code.',
        code: 'QR_REVOKED',
      });
    });
  });

  describe('3. Customer Profile Editing & Backend Sanitization', () => {
    it('should sanitize profile update, rejecting role, organizationId, and password tampering', async () => {
      const existingUser = {
        id: 'cust-100',
        fullName: 'Original Name',
        email: 'original@example.com',
        role: 'CUSTOMER',
        organizationId: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        fullName: 'New Name',
        phoneNumber: '+233240000000',
      });

      const req: any = {
        user: { id: 'cust-100' },
        body: {
          fullName: 'New Name',
          phoneNumber: '+233240000000',
          role: 'SUPER_ADMIN', // Attempted privilege escalation
          organizationId: 'org-hacked', // Attempted tenancy hijack
          passwordHash: 'injected_hash',
        },
      };
      const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.updateProfile(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'cust-100' },
        data: {
          fullName: 'New Name',
          phoneNumber: '+233240000000',
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PROFILE_UPDATED',
            userId: 'cust-100',
          }),
        })
      );
    });

    it('should parse DD/MM/YYYY date of birth and validate email address format', async () => {
      const existingUser = {
        id: 'cust-101',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        dob: new Date('1995-08-15T00:00:00.000Z'),
      });

      const req: any = {
        user: { id: 'cust-101' },
        body: {
          dob: '15/08/1995', // DD/MM/YYYY format
        },
      };
      const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.updateProfile(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-101' },
          data: expect.objectContaining({
            dob: expect.any(Date),
          }),
        })
      );
    });

    it('should reject invalid email format with a 400 error', async () => {
      const existingUser = {
        id: 'cust-102',
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'CUSTOMER',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const req: any = {
        user: { id: 'cust-102' },
        body: {
          email: 'not-a-valid-email',
        },
      };
      const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid email address format' })
      );
    });
  });
});
