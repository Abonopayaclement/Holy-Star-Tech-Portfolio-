import prisma from '../config/prisma';
import * as qrController from '../controllers/qrController';
import * as queueController from '../controllers/queueController';
import * as queueService from './queueService';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    branch: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    queue: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    queueEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
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

jest.mock('./queueService', () => ({
  joinQueue: jest.fn(),
}));

describe('Walk-In Tickets & QR Architecture', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveQr', () => {
    it('should resolve a dynamic active QR code with expiration and status', async () => {
      const mockDynamicQr = {
        id: 'qr-dyn-1',
        token: 'QR-APEX-1234',
        type: 'BRANCH',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        organizationId: 'org-1',
        branchId: 'branch-123',
        organization: { id: 'org-1', name: 'Apex Bank', type: 'Banking', logo: null },
        branch: {
          id: 'branch-123',
          name: 'Airport City Branch',
          location: 'Airport City, Accra',
          operatingHours: '08:00 - 17:00',
          qrCodeId: 'QR-ACCRA-01',
          isActive: true,
        },
        service: null,
      };

      const mockServices = [
        { id: 'svc-1', name: 'Customer Support', duration: 15, price: 0, allowRemoteJoin: true, queues: [{ id: 'q-1', status: 'OPEN' }] },
      ];

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockDynamicQr);
      (prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices);

      const req: any = { params: { code: 'QR-APEX-1234' } };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.resolveQr(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BRANCH',
          qrCode: expect.objectContaining({ token: 'QR-APEX-1234', status: 'ACTIVE' }),
          branch: expect.objectContaining({ id: 'branch-123', name: 'Airport City Branch' }),
          organization: expect.objectContaining({ name: 'Apex Bank' }),
        })
      );
    });

    it('should reject a revoked QR code with code QR_REVOKED', async () => {
      const mockRevokedQr = {
        id: 'qr-rev-1',
        token: 'QR-REVOKED-TOKEN',
        type: 'BRANCH',
        status: 'REVOKED',
        branch: { isActive: true },
      };

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockRevokedQr);

      const req: any = { params: { code: 'QR-REVOKED-TOKEN' } };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.resolveQr(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'QR_REVOKED',
          error: expect.stringContaining('closed by the organization'),
        })
      );
    });

    it('should reject an expired QR code with code QR_EXPIRED', async () => {
      const mockExpiredQr = {
        id: 'qr-exp-1',
        token: 'QR-EXPIRED-TOKEN',
        type: 'BRANCH',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 3600000), // expired 1 hour ago
        branch: { isActive: true },
      };

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockExpiredQr);
      (prisma.qRCode.update as jest.Mock).mockResolvedValue({ ...mockExpiredQr, status: 'EXPIRED' });

      const req: any = { params: { code: 'QR-EXPIRED-TOKEN' } };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.resolveQr(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'QR_EXPIRED',
          error: expect.stringContaining('no longer active'),
        })
      );
    });

    it('should resolve a legacy branch QR code if not in QRCode table', async () => {
      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(null);

      const mockBranch = {
        id: 'branch-123',
        name: 'Airport City Branch',
        location: 'Airport City, Accra',
        operatingHours: '08:00 - 17:00',
        qrCodeId: 'QR-ACCRA-01',
        organization: { id: 'org-1', name: 'Apex Bank', type: 'Banking', logo: null },
        services: [
          { id: 'svc-1', name: 'Cash Deposit', description: null, duration: 10, price: 0, queues: [{ id: 'q-1', status: 'OPEN' }] },
        ],
      };

      (prisma.branch.findFirst as jest.Mock).mockResolvedValue(mockBranch);

      const req: any = { params: { code: 'QR-ACCRA-01' } };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.resolveQr(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BRANCH',
          branch: expect.objectContaining({ id: 'branch-123', name: 'Airport City Branch' }),
          organization: expect.objectContaining({ name: 'Apex Bank' }),
        })
      );
    });

    it('should return 404 for completely unknown QR code', async () => {
      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.branch.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue(null);

      const req: any = { params: { code: 'UNKNOWN_QR' } };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.resolveQr(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Invalid or expired QR code') })
      );
    });
  });

  describe('generateBranchQr & revokeQr', () => {
    it('should generate a QR code with 24-hour expiration', async () => {
      const mockBranch = {
        id: 'branch-1',
        name: 'Airport City Branch',
        organizationId: 'org-1',
        managers: [{ id: 'user-manager-1' }],
      };

      const mockCreatedQr = {
        id: 'qr-new-1',
        token: 'QR-AIR-1A2B3C',
        type: 'BRANCH',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        organizationId: 'org-1',
        branchId: 'branch-1',
      };

      (prisma.branch.findUnique as jest.Mock).mockResolvedValue(mockBranch);
      (prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: 'svc-1', name: 'Teller', branchId: 'branch-1' });
      (prisma.qRCode.create as jest.Mock).mockResolvedValue(mockCreatedQr);

      const req: any = {
        params: { branchId: 'branch-1' },
        body: { type: 'SERVICE', serviceId: 'svc-1', validity: '24_HOURS' },
        user: { id: 'user-manager-1', role: 'SUPER_ADMIN' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.generateBranchQr(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'QR code generated successfully',
          qr: expect.objectContaining({ token: 'QR-AIR-1A2B3C' }),
        })
      );
    });

    it('should revoke an active QR code', async () => {
      const mockQr = {
        id: 'qr-to-revoke',
        token: 'QR-TOKEN-1',
        branchId: 'branch-1',
        organizationId: 'org-1',
      };

      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockQr);
      (prisma.qRCode.update as jest.Mock).mockResolvedValue({ ...mockQr, status: 'REVOKED' });

      const req: any = {
        params: { qrId: 'qr-to-revoke' },
        user: { id: 'admin-1', role: 'SUPER_ADMIN' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.revokeQr(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'QR code revoked successfully',
          qr: expect.objectContaining({ status: 'REVOKED' }),
        })
      );
    });
  });

  describe('createWalkInTicket', () => {
    it('should create walk-in customer and pass to same queue engine with isWalkIn option', async () => {
      const mockQueue = {
        id: 'queue-1',
        branchId: 'branch-1',
        status: 'OPEN',
        branch: { id: 'branch-1', name: 'Airport Branch' },
        service: { id: 'svc-1', name: 'Customer Support' },
      };

      const mockCustomer = {
        id: 'walkin-cust-1',
        fullName: 'Jane Doe',
        phoneNumber: '+233501234567',
        role: 'CUSTOMER',
      };

      const mockEntry = {
        id: 'entry-99',
        ticketNumber: 'C-014',
        position: 3,
        status: 'WAITING',
      };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCustomer);
      (queueService.joinQueue as jest.Mock).mockResolvedValue(mockEntry);

      const req: any = {
        body: { queueId: 'queue-1', fullName: 'Jane Doe', phoneNumber: '+233501234567' },
        user: { id: 'staff-1', role: 'STAFF', staffBranchId: 'branch-1' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await queueController.createWalkInTicket(req, res);

      expect(queueService.joinQueue).toHaveBeenCalledWith('walkin-cust-1', 'queue-1', { isWalkIn: true });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketNumber: 'C-014',
          position: 3,
          serviceName: 'Customer Support',
          branchName: 'Airport Branch',
        })
      );
    });

    it('should resolve open queue by serviceId if queueId is not provided', async () => {
      const mockQueue = {
        id: 'queue-from-service',
        branchId: 'branch-1',
        status: 'OPEN',
        branch: { id: 'branch-1', name: 'Airport Branch' },
        service: { id: 'svc-1', name: 'Customer Support' },
      };

      (prisma.queue.findFirst as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'w-1', fullName: 'Walk-in' });
      (queueService.joinQueue as jest.Mock).mockResolvedValue({ id: 'e-1', ticketNumber: 'C-015', position: 4 });

      const req: any = {
        body: { serviceId: 'svc-1', branchId: 'branch-1' },
        user: { id: 'staff-1', role: 'SUPER_ADMIN' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await queueController.createWalkInTicket(req, res);

      expect(prisma.queue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ serviceId: 'svc-1' }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject walk-in creation if queue is closed', async () => {
      (prisma.queue.findUnique as jest.Mock).mockResolvedValue({
        id: 'queue-closed',
        status: 'CLOSED',
        branch: { id: 'b1' },
        service: { name: 'Loans' },
      });

      const req: any = {
        body: { queueId: 'queue-closed' },
        user: { id: 'staff-1', role: 'STAFF', staffBranchId: 'b1' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await queueController.createWalkInTicket(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('closed') })
      );
    });
  });

  describe('getBranchQrStats', () => {
    it('should calculate accurate branch QR statistics and service breakdown', async () => {
      const mockBranch = { id: 'branch-1', organizationId: 'org-1', managers: [{ id: 'user-manager-1' }] };
      const mockQrs = [
        { id: 'q1', token: 'QR-1', status: 'ACTIVE', expiresAt: new Date(Date.now() + 100000), serviceId: 's1', service: { id: 's1', name: 'Service 1' } },
        { id: 'q2', token: 'QR-2', status: 'REVOKED', expiresAt: null, serviceId: 's1', service: { id: 's1', name: 'Service 1' } },
        { id: 'q3', token: 'QR-3', status: 'EXPIRED', expiresAt: new Date(Date.now() - 100000), serviceId: 's2', service: { id: 's2', name: 'Service 2' } },
      ];
      const mockServices = [
        { id: 's1', name: 'Service 1', duration: 15 },
        { id: 's2', name: 'Service 2', duration: 20 },
      ];

      (prisma.branch.findUnique as jest.Mock).mockResolvedValue(mockBranch);
      (prisma.qRCode.findMany as jest.Mock).mockResolvedValue(mockQrs);
      (prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices);

      const req: any = {
        params: { branchId: 'branch-1' },
        user: { id: 'user-manager-1', role: 'SUPER_ADMIN' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await qrController.getBranchQrStats(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalQrCodes: 3,
          activeQrCodes: 1,
          revokedQrCodes: 1,
          expiredQrCodes: 1,
          serviceBreakdown: expect.arrayContaining([
            expect.objectContaining({ serviceName: 'Service 1', activeQrCount: 1, totalQrCount: 2, hasActiveQr: true }),
            expect.objectContaining({ serviceName: 'Service 2', activeQrCount: 0, totalQrCount: 1, hasActiveQr: false }),
          ]),
        })
      );
    });
  });

  describe('joinQueue with QR Validation', () => {
    it('should successfully join queue when a valid active QR token is provided', async () => {
      const mockUser = { id: 'cust-1', role: 'CUSTOMER' };
      const mockQr = {
        id: 'qr-1',
        token: 'QR-VALID-123',
        status: 'ACTIVE',
        serviceId: 'svc-1',
        branchId: 'b-1',
        organizationId: 'org-1',
        expiresAt: new Date(Date.now() + 86400000),
        service: { id: 'svc-1', name: 'SIM Reg' },
      };
      const mockQueue = { id: 'queue-1', serviceId: 'svc-1', status: 'OPEN', service: { name: 'SIM Reg' } };
      const mockEntry = { id: 'entry-1', ticketNumber: 'S-001', position: 1 };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockQr);
      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (queueService.joinQueue as jest.Mock).mockResolvedValue(mockEntry);

      const req: any = {
        body: { queueId: 'queue-1', qrToken: 'QR-VALID-123' },
        user: { id: 'cust-1' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await queueController.joinQueue(req, res);

      expect(queueService.joinQueue).toHaveBeenCalledWith('cust-1', 'queue-1', {
        isRemote: false,
        isQr: true,
        qrId: 'qr-1',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockEntry);
    });

    it('should reject join when QR token is revoked', async () => {
      const mockUser = { id: 'cust-1', role: 'CUSTOMER' };
      const mockQr = {
        id: 'qr-rev',
        token: 'QR-REV-123',
        status: 'REVOKED',
        serviceId: 'svc-1',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.qRCode.findUnique as jest.Mock).mockResolvedValue(mockQr);

      const req: any = {
        body: { queueId: 'queue-1', qrToken: 'QR-REV-123' },
        user: { id: 'cust-1' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await queueController.joinQueue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'QR_REVOKED' })
      );
    });
  });
});
