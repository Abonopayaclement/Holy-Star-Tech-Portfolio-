import * as analyticsService from './analyticsService';
import prisma from '../config/prisma';
import { EntryStatus, TicketSource, PriorityLevel, DeliveryStatus, DeliveryChannel, CallbackStatus } from '@prisma/client';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    queueEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    branch: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    queue: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    serviceCounter: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notificationDelivery: {
      findMany: jest.fn(),
    },
    callbackRequest: {
      findMany: jest.fn(),
    },
    conversation: {
      findMany: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mPrisma,
  };
});

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Percentile and Statistics Calculation', () => {
    it('handles empty dataset safely without division by zero', () => {
      const stats = analyticsService.calculatePercentiles([]);
      expect(stats.sampleSize).toBe(0);
      expect(stats.isLowSample).toBe(true);
      expect(stats.avg).toBe(0);
      expect(stats.p50).toBe(0);
      expect(stats.p75).toBe(0);
      expect(stats.p90).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });

    it('handles single sample safely with isLowSample=true', () => {
      const stats = analyticsService.calculatePercentiles([14.5]);
      expect(stats.sampleSize).toBe(1);
      expect(stats.isLowSample).toBe(true);
      expect(stats.avg).toBe(14.5);
      expect(stats.p50).toBe(14.5);
      expect(stats.p90).toBe(14.5);
      expect(stats.min).toBe(14.5);
      expect(stats.max).toBe(14.5);
    });

    it('calculates correct percentiles on multi-item dataset', () => {
      const dataset = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]; // 10 items
      const stats = analyticsService.calculatePercentiles(dataset);
      expect(stats.sampleSize).toBe(10);
      expect(stats.isLowSample).toBe(false);
      expect(stats.avg).toBe(27.5);
      expect(stats.p50).toBe(27.5); // median
      expect(stats.p90).toBe(45.5);
      expect(stats.min).toBe(5);
      expect(stats.max).toBe(50);
    });
  });

  describe('2. Date Range Resolution', () => {
    it('resolves today correctly', () => {
      const res = analyticsService.resolveDateRange('today');
      expect(res.rangeKey).toBe('today');
      expect(res.startDate.getHours()).toBe(0);
      expect(res.endDate.getHours()).toBe(23);
    });

    it('resolves last_7_days correctly', () => {
      const res = analyticsService.resolveDateRange('last_7_days');
      expect(res.rangeKey).toBe('last_7_days');
      const diffDays = Math.round((res.endDate.getTime() - res.startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(6);
    });

    it('resolves custom date range when valid', () => {
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-10T23:59:59.000Z';
      const res = analyticsService.resolveDateRange('custom', start, end);
      expect(res.rangeKey).toBe('custom');
      expect(res.startDate.toISOString()).toBe(start);
      expect(res.endDate.toISOString()).toBe(end);
    });
  });

  describe('3. Queue Lifecycle Metrics', () => {
    it('calculates wait time, service time, and completion rates accurately', async () => {
      const t0 = new Date('2026-09-25T10:00:00Z');
      const t1 = new Date('2026-09-25T10:10:00Z'); // 10 min wait
      const t2 = new Date('2026-09-25T10:12:00Z'); // started serving
      const t3 = new Date('2026-09-25T10:25:00Z'); // 13 min service, completed

      const mockEntries = [
        {
          id: 'e1',
          status: EntryStatus.COMPLETED,
          priority: PriorityLevel.NORMAL,
          source: TicketSource.REMOTE,
          joinedAt: t0,
          calledAt: t1,
          servingAt: t2,
          completedAt: t3,
          cancelledAt: null,
          transferredAt: null,
          transferredFromEntryId: null,
        },
        {
          id: 'e2',
          status: EntryStatus.CANCELLED,
          priority: PriorityLevel.NORMAL,
          source: TicketSource.WALK_IN,
          joinedAt: t0,
          calledAt: null,
          servingAt: null,
          completedAt: null,
          cancelledAt: t1,
          cancelledBy: 'CUSTOMER',
          transferredAt: null,
          transferredFromEntryId: null,
        },
      ];

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      const dateRange = { startDate: t0, endDate: t3 };
      const metrics = await analyticsService.getQueueLifecycleMetrics({}, dateRange);

      expect(metrics.totalTickets).toBe(2);
      expect(metrics.completedTickets).toBe(1);
      expect(metrics.cancelledTickets).toBe(1);
      expect(metrics.completionRate).toBe(50); // 1 / 2 = 50%
      expect(metrics.cancellationRate).toBe(50);
      expect(metrics.abandonmentRate).toBe(50);
      expect(metrics.waitTimeMinutes.avg).toBe(10);
      expect(metrics.serviceTimeMinutes.avg).toBe(13);
      expect(metrics.totalJourneyTimeMinutes.avg).toBe(25); // 10:00 to 10:25
    });

    it('correctly calculates multi-stage wait time for transferred tickets', async () => {
      const origJoin = new Date('2026-09-25T09:00:00Z');
      const origCall = new Date('2026-09-25T09:10:00Z'); // stage 1 wait = 10 min
      const transferTime = new Date('2026-09-25T09:15:00Z');
      const destCall = new Date('2026-09-25T09:20:00Z'); // stage 2 wait = 5 min

      const mockTransferredEntry = [
        {
          id: 'e-transferred',
          status: EntryStatus.COMPLETED,
          priority: PriorityLevel.NORMAL,
          source: TicketSource.REMOTE,
          joinedAt: origJoin,
          calledAt: destCall,
          servingAt: destCall,
          completedAt: new Date('2026-09-25T09:30:00Z'),
          transferredAt: transferTime,
          transferredFromEntryId: 'e-orig',
          transferredFromEntry: {
            joinedAt: origJoin,
            calledAt: origCall,
          },
        },
      ];

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue(mockTransferredEntry);

      const metrics = await analyticsService.getQueueLifecycleMetrics({}, { startDate: origJoin, endDate: destCall });
      expect(metrics.totalTickets).toBe(1);
      expect(metrics.transferredTickets).toBe(1);
      // Wait time must be stage 1 (10m) + stage 2 (5m) = 15 minutes
      expect(metrics.waitTimeMinutes.avg).toBe(15);
    });
  });

  describe('4. Hourly Demand and Day of Week', () => {
    it('aggregates tickets across 24 hourly buckets', async () => {
      const t = new Date('2026-09-25T14:30:00Z'); // Hour 14
      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        { joinedAt: t, calledAt: t, servingAt: t, completedAt: t, status: EntryStatus.COMPLETED },
      ]);

      const hourly = await analyticsService.getHourlyDemandMetrics({}, { startDate: t, endDate: t });
      expect(hourly.length).toBe(24);
      const bucket14 = hourly.find((b) => b.hour === t.getHours());
      expect(bucket14?.ticketCount).toBe(1);
      expect(bucket14?.completedCount).toBe(1);
    });

    it('aggregates tickets across day of week distribution', async () => {
      const t = new Date('2026-09-25T10:00:00Z'); // Friday
      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        { joinedAt: t, calledAt: t, status: EntryStatus.COMPLETED },
      ]);

      const days = await analyticsService.getDayOfWeekMetrics({}, { startDate: t, endDate: t });
      expect(days.length).toBe(7);
      const friday = days.find((d) => d.dayName === 'Friday');
      expect(friday?.ticketCount).toBe(1);
      expect(friday?.completedCount).toBe(1);
    });
  });

  describe('5. Channel, Priority & Transfer Analytics', () => {
    it('categorizes tickets by channel with completion rates', async () => {
      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        { source: TicketSource.KIOSK, status: EntryStatus.COMPLETED, joinedAt: new Date(), calledAt: new Date(), servingAt: new Date(), completedAt: new Date() },
        { source: TicketSource.QR, status: EntryStatus.CANCELLED, joinedAt: new Date(), calledAt: null, servingAt: null, completedAt: null },
      ]);

      const channels = await analyticsService.getChannelMetrics({}, { startDate: new Date(), endDate: new Date() });
      const kiosk = channels.find((c) => c.channel === TicketSource.KIOSK);
      const qr = channels.find((c) => c.channel === TicketSource.QR);

      expect(kiosk?.volume).toBe(1);
      expect(kiosk?.completionRate).toBe(100);
      expect(qr?.volume).toBe(1);
      expect(qr?.completionRate).toBe(0);
    });

    it('identifies service transfer patterns and durations', async () => {
      const tJoin = new Date('2026-09-25T10:00:00Z');
      const tTransfer = new Date('2026-09-25T10:10:00Z'); // 10 min before transfer
      const tComplete = new Date('2026-09-25T10:25:00Z'); // 15 min after transfer

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'entry-dest',
          status: EntryStatus.COMPLETED,
          joinedAt: tJoin,
          transferredAt: tTransfer,
          completedAt: tComplete,
          transferredFromEntryId: 'entry-src',
          originalServiceId: 'svc-teller',
          queue: { serviceId: 'svc-support', service: { name: 'Support' } },
          transferredFromEntry: {
            queue: { serviceId: 'svc-teller', service: { name: 'Teller' } },
          },
        },
      ]);
      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(10);

      const transfers = await analyticsService.getTransferMetrics({}, { startDate: tJoin, endDate: tComplete });
      expect(transfers.totalTransfers).toBe(1);
      expect(transfers.transferRate).toBe(10); // 1 out of 10 = 10%
      expect(transfers.avgTimeBeforeTransferMinutes).toBe(10);
      expect(transfers.avgTimeAfterTransferMinutes).toBe(15);
      expect(transfers.completedAfterTransferCount).toBe(1);
      expect(transfers.flowPatterns.length).toBe(1);
      expect(transfers.flowPatterns[0].sourceServiceName).toBe('Teller');
      expect(transfers.flowPatterns[0].destServiceName).toBe('Support');
    });
  });

  describe('6. Queue Congestion and Real-Time Operations', () => {
    it('correctly evaluates NORMAL congestion when load is light', async () => {
      (prisma.queue.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'q1',
          servingCapacity: 2,
          capacity: 50,
          entries: [
            { id: 'e1', status: EntryStatus.WAITING, joinedAt: new Date() },
          ],
        },
      ]);
      (prisma.serviceCounter.count as jest.Mock).mockResolvedValue(1);
      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(2);

      const congestion = await analyticsService.getQueueCongestionMetrics({});
      expect(congestion.status).toBe('NORMAL');
      expect(congestion.waitingCount).toBe(1);
    });

    it('correctly evaluates HIGH_LOAD when waiting count exceeds threshold', async () => {
      const oldTime = new Date(Date.now() - 40 * 60 * 1000); // 40 minutes wait
      const waitingEntries = Array.from({ length: 20 }, (_, i) => ({
        id: `e${i}`,
        status: EntryStatus.WAITING,
        joinedAt: oldTime,
      }));

      (prisma.queue.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'q1',
          servingCapacity: 1,
          capacity: 20,
          entries: waitingEntries,
        },
      ]);
      (prisma.serviceCounter.count as jest.Mock).mockResolvedValue(1);
      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(20);

      const congestion = await analyticsService.getQueueCongestionMetrics({});
      expect(congestion.status).toBe('HIGH_LOAD');
      expect(congestion.waitingCount).toBe(20);
    });
  });

  describe('7. Appointments & Communications Analytics', () => {
    it('calculates appointment rates and tracks rejection reasons factually', async () => {
      const now = new Date();
      (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
        { status: 'APPROVED', fee: 50, createdAt: now, scheduledTime: now, approvedAt: now, paidAt: now, startedAt: now, completedAt: now, rejectionReason: null, followUpStatus: 'RESOLVED' },
        { status: 'REJECTED', fee: 0, createdAt: now, scheduledTime: now, approvedAt: null, paidAt: null, startedAt: null, completedAt: null, rejectionReason: 'Verification needed', followUpStatus: null },
      ]);

      const appAnalytics = await analyticsService.getAppointmentAnalytics({}, { startDate: now, endDate: now });
      expect(appAnalytics.totalAppointments).toBe(2);
      expect(appAnalytics.approvalRate).toBe(50);
      expect(appAnalytics.rejectionRate).toBe(50);
      expect(appAnalytics.rejectionReasons).toEqual([{ reason: 'Verification needed', count: 1 }]);
      expect(appAnalytics.followUps.resolutionRate).toBe(100);
    });

    it('calculates notification delivery rates and callback acknowledgements', async () => {
      const now = new Date();
      (prisma.notificationDelivery.findMany as jest.Mock).mockResolvedValue([
        { channel: DeliveryChannel.SMS, status: DeliveryStatus.DELIVERED },
        { channel: DeliveryChannel.SMS, status: DeliveryStatus.OPENED },
        { channel: DeliveryChannel.PUSH, status: DeliveryStatus.FAILED },
      ]);
      (prisma.callbackRequest.findMany as jest.Mock).mockResolvedValue([
        { status: CallbackStatus.ACKNOWLEDGED },
        { status: CallbackStatus.CANCELLED },
      ]);
      (prisma.conversation.findMany as jest.Mock).mockResolvedValue([]);

      const comms = await analyticsService.getCommunicationAnalytics({}, { startDate: now, endDate: now });
      expect(comms.notifications.total).toBe(3);
      expect(comms.notifications.deliveryRate).toBe(100); // 2 delivered of 2 sent
      expect(comms.notifications.openRate).toBe(50); // 1 opened of 2 delivered
      expect(comms.callbacks.acknowledgementRate).toBe(100); // 1 ack out of 1 triggered
    });
  });

  describe('8. CSV Export Serializer', () => {
    it('generates properly formatted CSV string with headers and escaped values', async () => {
      const now = new Date('2026-09-25T10:00:00Z');
      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        {
          ticketNumber: 'A-001',
          position: 1,
          priority: PriorityLevel.NORMAL,
          source: TicketSource.REMOTE,
          counterNumber: 'Counter 1',
          status: EntryStatus.COMPLETED,
          joinedAt: now,
          calledAt: new Date(now.getTime() + 5 * 60000),
          servingAt: new Date(now.getTime() + 5 * 60000),
          completedAt: new Date(now.getTime() + 15 * 60000),
          cancellationReason: null,
          queue: {
            service: { name: 'Customer Care' },
            branch: { name: 'Airport Branch' },
          },
          user: { fullName: 'Alice, Smith' }, // Contains comma, tests escaping
        },
      ]);

      const csv = await analyticsService.exportAnalyticsToCsv({});
      expect(csv).toContain('Ticket Number,Branch,Service');
      expect(csv).toContain('"A-001"');
      expect(csv).toContain('"Alice, Smith"'); // properly quoted
      expect(csv).toContain('"5.0"'); // wait minutes
      expect(csv).toContain('"10.0"'); // service minutes
    });
  });
});
