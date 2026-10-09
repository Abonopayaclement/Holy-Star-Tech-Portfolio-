import { 
  CANCELLATION_REASONS, 
  validateCancellationReason 
} from '../constants/cancellationReasons';
import prisma from '../config/prisma';
import * as queueService from './queueService';
import { EntryStatus } from '@prisma/client';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    queueEntry: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
    },
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

describe('cancellationReasons & cancelEntry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCancellationReason', () => {
    it('Test A: validates official predefined reason correctly', () => {
      const result = validateCancellationReason('BRANCH_CLOSING_SOON');
      expect(result.isValid).toBe(true);
      expect(result.formattedReason).toBe('Branch closing soon');
      expect(result.error).toBeUndefined();
    });

    it('Test B: rejects unknown/unauthorized reason code', () => {
      const result = validateCancellationReason('UNKNOWN_REASON_CODE');
      expect(result.isValid).toBe(false);
      expect(result.formattedReason).toBeUndefined();
      expect(result.error).toContain('Invalid cancellation reason');
    });

    it('Test C: requires explanation note when reason is OTHER', () => {
      // Empty or missing note
      const missingNote = validateCancellationReason('OTHER', '');
      expect(missingNote.isValid).toBe(false);
      expect(missingNote.error).toContain('Please provide a specific explanation');

      // Valid note
      const withNote = validateCancellationReason('OTHER', 'Special VIP security perimeter protocol');
      expect(withNote.isValid).toBe(true);
      expect(withNote.formattedReason).toBe('Other: Special VIP security perimeter protocol');
    });

    it('Test D: appends optional note to predefined reason if provided', () => {
      const result = validateCancellationReason('TECHNICAL_ISSUE', 'Fiber connection outage from ISP');
      expect(result.isValid).toBe(true);
      expect(result.formattedReason).toBe('Technical issue (Fiber connection outage from ISP)');
    });
  });

  describe('cancelEntry with reasons', () => {
    it('Test E: saves cancellationReason and cancelledBy on QueueEntry and emits socket event', async () => {
      const mockEntry = {
        id: 'entry-1',
        queueId: 'q-1',
        ticketNumber: 'T-101',
        status: EntryStatus.WAITING,
        queue: {
          branchId: 'b-1',
          branch: { organizationId: 'org-1' },
          service: { name: 'Teller' },
        },
      };

      const updatedMockEntry = {
        ...mockEntry,
        status: EntryStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Staff unavailable',
        cancelledBy: 'John Staff',
      };

      (prisma.queueEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);
      (prisma.queueEntry.update as jest.Mock).mockResolvedValue(updatedMockEntry);

      const result = await queueService.cancelEntry('entry-1', 'staff-user-1', {
        cancellationReason: 'Staff unavailable',
        cancelledBy: 'John Staff',
      });

      expect(prisma.queueEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: expect.objectContaining({
          status: EntryStatus.CANCELLED,
          cancellationReason: 'Staff unavailable',
          cancelledBy: 'John Staff',
        }),
        include: expect.any(Object),
      });

      expect((result as any).cancellationReason).toBe('Staff unavailable');
      expect((result as any).cancelledBy).toBe('John Staff');
    });
  });
});
