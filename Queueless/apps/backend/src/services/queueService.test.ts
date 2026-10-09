import prisma from '../config/prisma';
import * as queueService from './queueService';
import { io } from '../index';
import { EntryStatus } from '@prisma/client';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    queue: {
      findUnique: jest.fn(),
    },
    queueEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(async (callback: any) => await callback(mPrisma)),
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

describe('queueService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('joinQueue', () => {
    it('should join queue and notify room', async () => {
      const userId = 'user1';
      const queueId = 'queue1';
      const mockQueue = { id: queueId, branchId: 'b1', branch: { organizationId: 'o1' }, service: { name: 'Teller' }, status: 'OPEN' };
      const lastEntry = { position: 5 };
      const newEntry = { id: 'entry1', userId, queueId, position: 6, ticketNumber: 'T-001', status: EntryStatus.WAITING };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queueEntry.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(lastEntry);
      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(0);
      (prisma.queueEntry.create as jest.Mock).mockResolvedValue(newEntry);

      const result = await queueService.joinQueue(userId, queueId);

      expect(result).toEqual(newEntry);
      expect(prisma.queueEntry.create).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith(`queue_${queueId}`);
      expect(io.emit).toHaveBeenCalledWith('queue_updated', {
        type: 'USER_JOINED',
        entry: newEntry,
      });
    });

    it('should reject remote join if allowRemoteJoin is false on service', async () => {
      const mockQueue = {
        id: 'q-no-remote',
        branchId: 'b1',
        branch: { organizationId: 'o1' },
        service: { name: 'Sensitive Service', allowRemoteJoin: false },
        status: 'OPEN',
      };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);

      await expect(
        queueService.joinQueue('user-1', 'q-no-remote', { isRemote: true })
      ).rejects.toThrow('Remote queue joining is disabled for this service');
    });

    it('should reject join if queue capacity is reached', async () => {
      const mockQueue = {
        id: 'q-capacity',
        branchId: 'b1',
        branch: { organizationId: 'o1' },
        service: { name: 'Teller', allowRemoteJoin: true, capacity: 5 },
        status: 'OPEN',
      };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(5); // 5 waiting, limit is 5

      await expect(
        queueService.joinQueue('user-1', 'q-capacity')
      ).rejects.toThrow('This queue has reached its maximum capacity');
    });

    it('should return existing active ticket if customer is already in queue', async () => {
      const existingEntry = {
        id: 'existing-entry-1',
        userId: 'user-already-in',
        queueId: 'q1',
        ticketNumber: 'T-004',
        status: EntryStatus.WAITING,
      };

      const mockQueue = {
        id: 'q1',
        branchId: 'b1',
        branch: { organizationId: 'o1' },
        service: { name: 'Teller', allowRemoteJoin: true },
        status: 'OPEN',
      };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(existingEntry);

      const result = await queueService.joinQueue('user-already-in', 'q1');

      expect(result).toEqual(existingEntry);
      expect(prisma.queueEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('callNext', () => {
    it('should call the next waiting user', async () => {
      const queueId = 'queue1';
      const mockQueue = { id: queueId, branch: { id: 'b1', organizationId: 'o1' } };
      const nextEntry = { id: 'entry1', queueId, status: EntryStatus.WAITING, position: 1 };
      const updatedEntry = { ...nextEntry, status: EntryStatus.CALLING, calledAt: new Date() };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(nextEntry);
      (prisma.queueEntry.update as jest.Mock).mockResolvedValue(updatedEntry);

      const result = await queueService.callNext(queueId);

      expect(result).toEqual(updatedEntry);
      expect(prisma.queueEntry.update).toHaveBeenCalled();
      expect(io.to).toHaveBeenCalledWith(`queue_${queueId}`);
      expect(io.emit).toHaveBeenCalledWith('queue_updated', {
        type: 'USER_CALLED',
        entry: updatedEntry,
      });
    });

    it('should return null if no users are waiting', async () => {
      const queueId = 'queue1';
      const mockQueue = { id: queueId, branch: { id: 'b1', organizationId: 'o1' } };

      (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
      (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await queueService.callNext(queueId);

      expect(result).toBeNull();
      expect(prisma.queueEntry.update).not.toHaveBeenCalled();
    });
  });

  describe('getCustomerTicketStatus', () => {
    it('should compute correct position and customer wait metrics', async () => {
      const mockEntry = {
        id: 'entry1',
        queueId: 'q1',
        ticketNumber: 'A-014',
        position: 4,
        status: EntryStatus.WAITING,
        queue: {
          service: { name: 'Account Opening', duration: 12 },
          branch: { name: 'Airport City Branch', location: 'Accra' },
        },
        user: { fullName: 'Kofi Mensah', email: 'kofi@test.com' },
      };

      (prisma.queueEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(3); // 3 customers ahead
      (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue({
        ticketNumber: 'A-010',
        status: EntryStatus.SERVING,
        position: 1,
      });

      const result = await queueService.getCustomerTicketStatus('entry1');

      expect(result).not.toBeNull();
      expect(result?.ticketNumber).toBe('A-014');
      expect(result?.serviceName).toBe('Account Opening');
      expect(result?.branchName).toBe('Airport City Branch');
      expect(result?.position).toBe(4); // 3 ahead + 1 = 4
      expect(result?.customersAhead).toBe(3);
      expect(result?.estimatedWaitTimeMinutes).toBe(36); // 3 * 12 = 36
      expect(result?.nowServing?.ticketNumber).toBe('A-010');
    });
  });

  describe('getUserQueueHistory', () => {
    it('should return all tickets for user ordered by joinedAt desc', async () => {
      const mockHistory = [
        { id: 'e1', ticketNumber: 'A-001', status: EntryStatus.COMPLETED, joinedAt: new Date() },
        { id: 'e2', ticketNumber: 'A-002', status: EntryStatus.WAITING, joinedAt: new Date() },
      ];

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(mockHistory);

      const result = await queueService.getUserQueueHistory('u1');

      expect(result).toEqual(mockHistory);
      expect(prisma.queueEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1' }),
          orderBy: { joinedAt: 'desc' },
        })
      );
    });
  });
});
