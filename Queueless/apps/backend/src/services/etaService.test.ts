import prisma from '../config/prisma';
import { calculateQueueEta } from './etaService';
import { EntryStatus } from '@prisma/client';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    queue: {
      findUnique: jest.fn(),
    },
    queueEntry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: mPrisma,
  };
});

describe('etaService - Dynamic Service ETA Calculation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockQueue = {
    id: 'queue-1',
    service: {
      id: 'srv-1',
      name: 'SIM Registration',
      duration: 10, // 10 min baseline
    },
  };

  it('Test A: returns configured baseline pace when no completed tickets exist (N=0)', async () => {
    (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
    // No completed tickets in the last 24h
    (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([]);
    // No currently serving ticket
    (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await calculateQueueEta('queue-1', 3, EntryStatus.WAITING, mockQueue);

    expect(result.baselineDurationMinutes).toBe(10);
    expect(result.dynamicPaceMinutes).toBe(10);
    expect(result.isDynamic).toBe(false);
    expect(result.completedSampleCount).toBe(0);
    expect(result.recentAverageMinutes).toBeNull();
    // 3 people ahead * 10 mins baseline = 30 mins
    expect(result.estimatedWaitTimeMinutes).toBe(30);
  });

  it('Test B: applies Bayesian smoothing when actual completions exist', async () => {
    (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);

    const now = Date.now();
    // 3 completed tickets with durations: 6m, 8m, 6m (sum = 20m, avg = 6.67m)
    const completedTickets = [
      {
        servingAt: new Date(now - 30 * 60000),
        completedAt: new Date(now - 24 * 60000), // 6 minutes
      },
      {
        servingAt: new Date(now - 20 * 60000),
        completedAt: new Date(now - 12 * 60000), // 8 minutes
      },
      {
        servingAt: new Date(now - 10 * 60000),
        completedAt: new Date(now - 4 * 60000), // 6 minutes
      },
    ];

    (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(completedTickets);
    // No currently serving ticket
    (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await calculateQueueEta('queue-1', 2, EntryStatus.WAITING, mockQueue);

    // Formula: (K * baseline + sum) / (K + N) = (2 * 10 + 20) / (2 + 3) = 40 / 5 = 8.0 mins
    expect(result.isDynamic).toBe(true);
    expect(result.completedSampleCount).toBe(3);
    expect(result.recentAverageMinutes).toBe(6.7);
    expect(result.dynamicPaceMinutes).toBe(8);
    // 2 people ahead * 8 mins dynamic pace = 16 mins
    expect(result.estimatedWaitTimeMinutes).toBe(16);
  });

  it('Test C: accounts for elapsed time of currently serving ticket', async () => {
    (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
    (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([]); // baseline = 10m

    // Ticket serving started 4 minutes ago
    const now = Date.now();
    (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue({
      id: 'active-serving-1',
      servingAt: new Date(now - 4 * 60000), // 4 mins elapsed
    });

    const result = await calculateQueueEta('queue-1', 1, EntryStatus.WAITING, mockQueue);

    // dynamic pace = 10m. Elapsed = 4m => remaining on counter = 6m.
    // 1 customer waiting ahead * 10m = 10m. Total = 6m + 10m = 16m.
    expect(result.dynamicPaceMinutes).toBe(10);
    expect(result.estimatedWaitTimeMinutes).toBe(16);
  });

  it('Test D: filters out extreme outliers (< 0.5 mins or > 120 mins)', async () => {
    (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);

    const now = Date.now();
    const outlierTickets = [
      {
        // 5 seconds (accidental instant click) -> filtered out
        servingAt: new Date(now - 60000),
        completedAt: new Date(now - 55000),
      },
      {
        // 5 hours (staff forgot to complete ticket overnight) -> filtered out
        servingAt: new Date(now - 300 * 60000),
        completedAt: new Date(now),
      },
      {
        // Normal 12 min ticket -> kept
        servingAt: new Date(now - 20 * 60000),
        completedAt: new Date(now - 8 * 60000),
      },
    ];

    (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(outlierTickets);
    (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await calculateQueueEta('queue-1', 1, EntryStatus.WAITING, mockQueue);

    // Only 1 valid sample of 12m
    expect(result.completedSampleCount).toBe(1);
    // Bayesian: (2 * 10 + 12) / (2 + 1) = 32 / 3 = 10.67 => 10.7 pace
    expect(result.dynamicPaceMinutes).toBe(10.7);
    expect(result.estimatedWaitTimeMinutes).toBe(11);
  });

  it('Test E: returns 0 wait time when customer is currently SERVING or CALLING', async () => {
    (prisma.queue.findUnique as jest.Mock).mockResolvedValue(mockQueue);
    (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.queueEntry.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await calculateQueueEta('queue-1', 0, EntryStatus.SERVING, mockQueue);
    expect(result.estimatedWaitTimeMinutes).toBe(0);
  });
});
