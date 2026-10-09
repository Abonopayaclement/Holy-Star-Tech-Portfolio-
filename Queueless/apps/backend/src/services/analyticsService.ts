import prisma from '../config/prisma';
import { EntryStatus, TicketSource, PriorityLevel, DeliveryStatus, DeliveryChannel, CallbackStatus, AppointmentStatus } from '@prisma/client';
import {
  AnalyticsFilterParams,
  PercentileMetrics,
  QueueAnalyticsOverview,
  HourlyDemandMetric,
  DayOfWeekMetric,
  ServicePerformanceMetric,
  BranchPerformanceMetric,
  OrganizationPerformanceMetric,
  ChannelMetric,
  PriorityMetric,
  TransferMetric,
  TransferFlowPattern,
  QueueCongestionMetric,
  QueueCongestionStatus,
  RealTimeOperationsSnapshot,
  StaffPerformanceMetric,
  CounterAnalyticsMetric,
  AppointmentAnalyticsMetric,
  CommunicationAnalyticsMetric,
  ComprehensiveAnalyticsDashboardData,
  SystemQueueMetric,
  PlatformUserMetric,
  Role,
} from '@queueless/types';
import { ANALYTICS_DEFINITIONS } from '../constants/analyticsDefinitions';

/**
 * 1. Date Range Resolution with Timezone Offset Awareness
 */
export const resolveDateRange = (
  range: string = 'today',
  startIso?: string,
  endIso?: string,
  timezone: string = 'UTC'
): { startDate: Date; endDate: Date; rangeKey: string } => {
  const now = new Date();

  if (range === 'custom' && startIso && endIso) {
    const s = new Date(startIso);
    const e = new Date(endIso);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      return { startDate: s, endDate: e, rangeKey: 'custom' };
    }
  }

  const s = new Date(now);
  const e = new Date(now);

  switch (range) {
    case 'yesterday': {
      s.setDate(s.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      e.setDate(e.getDate() - 1);
      e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e, rangeKey: 'yesterday' };
    }
    case 'last_7_days': {
      s.setDate(s.getDate() - 7);
      s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: e, rangeKey: 'last_7_days' };
    }
    case 'last_30_days': {
      s.setDate(s.getDate() - 30);
      s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: e, rangeKey: 'last_30_days' };
    }
    case 'this_month': {
      s.setDate(1);
      s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: e, rangeKey: 'this_month' };
    }
    case 'last_month': {
      s.setMonth(s.getMonth() - 1, 1);
      s.setHours(0, 0, 0, 0);
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: s, endDate: lastDayOfPrevMonth, rangeKey: 'last_month' };
    }
    case 'today':
    default: {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { startDate: s, endDate: e, rangeKey: 'today' };
    }
  }
};

/**
 * 2. Exact Percentile and Summary Statistics Calculator
 */
export const calculatePercentiles = (values: number[]): PercentileMetrics => {
  const sampleSize = values.length;
  const isLowSample = sampleSize < ANALYTICS_DEFINITIONS.SAMPLE_SIZE.MINIMUM_SIGNIFICANT_SAMPLE;

  if (sampleSize === 0) {
    return {
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      min: 0,
      max: 0,
      avg: 0,
      total: 0,
      sampleSize: 0,
      isLowSample: true,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const total = Math.round(sum * 10) / 10;
  const avg = Math.round((sum / sampleSize) * 10) / 10;
  const min = Math.round(sorted[0] * 10) / 10;
  const max = Math.round(sorted[sampleSize - 1] * 10) / 10;

  const getPercentile = (p: number): number => {
    if (sampleSize === 1) return sorted[0];
    const index = (p / 100) * (sampleSize - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    const value = sorted[lower] * (1 - weight) + sorted[upper] * weight;
    return Math.round(value * 10) / 10;
  };

  return {
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    min,
    max,
    avg,
    total,
    sampleSize,
    isLowSample,
  };
};

/**
 * Common Prisma where clause builder from filter parameters
 */
export const buildQueueEntryWhereClause = (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
) => {
  const where: any = {
    joinedAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };

  if (filter.serviceId) {
    where.queue = { serviceId: filter.serviceId };
  } else if (filter.branchId) {
    where.queue = { branchId: filter.branchId };
  } else if (filter.organizationId) {
    where.queue = { branch: { organizationId: filter.organizationId } };
  }

  if (filter.channel) {
    where.source = filter.channel as TicketSource;
  }

  if (filter.priority) {
    where.priority = filter.priority as PriorityLevel;
  }

  if (filter.status) {
    where.status = filter.status as EntryStatus;
  }

  return where;
};

/**
 * 3. Queue Lifecycle Metrics (Wait Time, Service Time, Total Journey Time, Rates)
 */
export const getQueueLifecycleMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<QueueAnalyticsOverview> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where,
    select: {
      id: true,
      status: true,
      priority: true,
      source: true,
      joinedAt: true,
      calledAt: true,
      servingAt: true,
      completedAt: true,
      cancelledAt: true,
      cancellationReason: true,
      cancelledBy: true,
      transferredAt: true,
      transferredFromEntryId: true,
      transferredFromEntry: {
        select: {
          joinedAt: true,
          calledAt: true,
        },
      },
    },
  });

  const totalTickets = entries.length;
  let waitingTickets = 0;
  let servingTickets = 0;
  let completedTickets = 0;
  let cancelledTickets = 0;
  let skippedTickets = 0;
  let absentTickets = 0;
  let transferredTickets = 0;
  let customerAbandonedCount = 0;

  const waitTimes: number[] = [];
  const serviceTimes: number[] = [];
  const journeyTimes: number[] = [];

  for (const entry of entries) {
    switch (entry.status) {
      case EntryStatus.WAITING:
        waitingTickets++;
        break;
      case EntryStatus.CALLING:
      case EntryStatus.SERVING:
        servingTickets++;
        break;
      case EntryStatus.COMPLETED:
        completedTickets++;
        break;
      case EntryStatus.CANCELLED:
        cancelledTickets++;
        // Track customer abandonment vs staff cancellation
        if (entry.cancelledBy && entry.cancelledBy.toLowerCase().includes('customer')) {
          customerAbandonedCount++;
        }
        break;
      case EntryStatus.SKIPPED:
        skippedTickets++;
        break;
      case EntryStatus.ABSENT:
        absentTickets++;
        customerAbandonedCount++;
        break;
    }

    if (entry.transferredAt || entry.transferredFromEntryId) {
      transferredTickets++;
    }

    // Wait Time calculation
    // If ticket was called or served or completed
    if (entry.calledAt) {
      let waitMinutes = 0;
      if (entry.transferredFromEntryId && entry.transferredFromEntry && entry.transferredAt) {
        // Multi-stage transfer wait handling
        const stage1Wait = entry.transferredFromEntry.calledAt
          ? (entry.transferredFromEntry.calledAt.getTime() - entry.transferredFromEntry.joinedAt.getTime()) / 60000
          : (entry.transferredAt.getTime() - entry.transferredFromEntry.joinedAt.getTime()) / 60000;
        const stage2Wait = (entry.calledAt.getTime() - entry.transferredAt.getTime()) / 60000;
        waitMinutes = Math.max(0, stage1Wait) + Math.max(0, stage2Wait);
      } else {
        waitMinutes = (entry.calledAt.getTime() - entry.joinedAt.getTime()) / 60000;
      }
      waitTimes.push(Math.max(0, waitMinutes));
    }

    // Service Time calculation (only completed tickets)
    if (entry.status === EntryStatus.COMPLETED && entry.completedAt) {
      const startTime = entry.servingAt || entry.calledAt;
      if (startTime) {
        const durationMinutes = (entry.completedAt.getTime() - startTime.getTime()) / 60000;
        serviceTimes.push(Math.max(0, durationMinutes));
      }

      // Total Customer Journey Time
      const totalJourneyMinutes = (entry.completedAt.getTime() - entry.joinedAt.getTime()) / 60000;
      journeyTimes.push(Math.max(0, totalJourneyMinutes));
    }
  }

  const closedTickets = completedTickets + cancelledTickets + skippedTickets + absentTickets;
  const completionRate = closedTickets > 0 ? Math.round((completedTickets / closedTickets) * 1000) / 10 : 0;
  const cancellationRate = closedTickets > 0 ? Math.round((cancelledTickets / closedTickets) * 1000) / 10 : 0;
  const abandonmentRate = totalTickets > 0 ? Math.round((customerAbandonedCount / totalTickets) * 1000) / 10 : 0;

  return {
    totalTickets,
    waitingTickets,
    servingTickets,
    completedTickets,
    cancelledTickets,
    skippedTickets,
    absentTickets,
    transferredTickets,
    completionRate,
    cancellationRate,
    abandonmentRate,
    waitTimeMinutes: calculatePercentiles(waitTimes),
    serviceTimeMinutes: calculatePercentiles(serviceTimes),
    totalJourneyTimeMinutes: calculatePercentiles(journeyTimes),
  };
};

/**
 * 4. Hourly Demand Analysis (24-Hour Distribution)
 */
export const getHourlyDemandMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<HourlyDemandMetric[]> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where,
    select: {
      joinedAt: true,
      calledAt: true,
      servingAt: true,
      completedAt: true,
      status: true,
    },
  });

  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    hourLabel: `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`,
    ticketCount: 0,
    completedCount: 0,
    waitMinutesList: [] as number[],
    serviceMinutesList: [] as number[],
  }));

  for (const entry of entries) {
    const hour = entry.joinedAt.getHours();
    if (hour >= 0 && hour < 24) {
      buckets[hour].ticketCount++;
      if (entry.status === EntryStatus.COMPLETED) {
        buckets[hour].completedCount++;
      }
      if (entry.calledAt) {
        buckets[hour].waitMinutesList.push(Math.max(0, (entry.calledAt.getTime() - entry.joinedAt.getTime()) / 60000));
      }
      if (entry.status === EntryStatus.COMPLETED && entry.completedAt) {
        const start = entry.servingAt || entry.calledAt;
        if (start) {
          buckets[hour].serviceMinutesList.push(Math.max(0, (entry.completedAt.getTime() - start.getTime()) / 60000));
        }
      }
    }
  }

  return buckets.map((b) => {
    const avgWait = b.waitMinutesList.length > 0
      ? Math.round((b.waitMinutesList.reduce((acc, c) => acc + c, 0) / b.waitMinutesList.length) * 10) / 10
      : 0;
    const avgService = b.serviceMinutesList.length > 0
      ? Math.round((b.serviceMinutesList.reduce((acc, c) => acc + c, 0) / b.serviceMinutesList.length) * 10) / 10
      : 0;

    return {
      hour: b.hour,
      hourLabel: b.hourLabel,
      ticketCount: b.ticketCount,
      completedCount: b.completedCount,
      avgWaitMinutes: avgWait,
      avgServiceMinutes: avgService,
    };
  });
};

/**
 * 5. Day of Week Demand Analysis (Monday - Sunday)
 */
export const getDayOfWeekMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<DayOfWeekMetric[]> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where,
    select: {
      joinedAt: true,
      calledAt: true,
      status: true,
    },
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    dayName: dayNames[dayOfWeek],
    ticketCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    waitMinutesList: [] as number[],
  }));

  for (const entry of entries) {
    const d = entry.joinedAt.getDay();
    days[d].ticketCount++;
    if (entry.status === EntryStatus.COMPLETED) days[d].completedCount++;
    if (entry.status === EntryStatus.CANCELLED) days[d].cancelledCount++;
    if (entry.calledAt) {
      days[d].waitMinutesList.push(Math.max(0, (entry.calledAt.getTime() - entry.joinedAt.getTime()) / 60000));
    }
  }

  // Reorder starting Monday (1) to Sunday (0) for natural business view
  const reordered = [...days.slice(1), days[0]];

  return reordered.map((d) => {
    const avgWait = d.waitMinutesList.length > 0
      ? Math.round((d.waitMinutesList.reduce((acc, c) => acc + c, 0) / d.waitMinutesList.length) * 10) / 10
      : 0;
    const closed = d.completedCount + d.cancelledCount;
    const completionRate = closed > 0 ? Math.round((d.completedCount / closed) * 1000) / 10 : 0;
    const cancellationRate = closed > 0 ? Math.round((d.cancelledCount / closed) * 1000) / 10 : 0;

    return {
      dayOfWeek: d.dayOfWeek,
      dayName: d.dayName,
      ticketCount: d.ticketCount,
      completedCount: d.completedCount,
      avgWaitMinutes: avgWait,
      completionRate,
      cancellationRate,
    };
  });
};

/**
 * 6. Service Performance Metrics
 */
export const getServicePerformanceMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<ServicePerformanceMetric[]> => {
  const serviceWhere: any = { isActive: true };
  if (filter.serviceId) {
    serviceWhere.id = filter.serviceId;
  } else if (filter.branchId) {
    serviceWhere.branchId = filter.branchId;
  } else if (filter.organizationId) {
    serviceWhere.branch = { organizationId: filter.organizationId };
  }

  const services = await prisma.service.findMany({
    where: serviceWhere,
    include: {
      branch: { select: { id: true, name: true } },
    },
  });

  const entryWhere = buildQueueEntryWhereClause(filter, dateRange);
  const entries = await prisma.queueEntry.findMany({
    where: entryWhere,
    select: {
      status: true,
      joinedAt: true,
      calledAt: true,
      servingAt: true,
      completedAt: true,
      queue: {
        select: { serviceId: true },
      },
    },
  });

  const serviceMap = new Map<string, {
    totalTickets: number;
    completedTickets: number;
    cancelledTickets: number;
    waitList: number[];
    serviceList: number[];
  }>();

  for (const s of services) {
    serviceMap.set(s.id, {
      totalTickets: 0,
      completedTickets: 0,
      cancelledTickets: 0,
      waitList: [],
      serviceList: [],
    });
  }

  for (const e of entries) {
    const sId = e.queue?.serviceId;
    if (sId && serviceMap.has(sId)) {
      const data = serviceMap.get(sId)!;
      data.totalTickets++;
      if (e.status === EntryStatus.COMPLETED) {
        data.completedTickets++;
      } else if (e.status === EntryStatus.CANCELLED) {
        data.cancelledTickets++;
      }

      if (e.calledAt) {
        data.waitList.push(Math.max(0, (e.calledAt.getTime() - e.joinedAt.getTime()) / 60000));
      }

      if (e.status === EntryStatus.COMPLETED && e.completedAt) {
        const start = e.servingAt || e.calledAt;
        if (start) {
          data.serviceList.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
        }
      }
    }
  }

  return services.map((s) => {
    const d = serviceMap.get(s.id)!;
    const waitStats = calculatePercentiles(d.waitList);
    const serviceStats = calculatePercentiles(d.serviceList);
    const closed = d.completedTickets + d.cancelledTickets;
    const completionRate = closed > 0 ? Math.round((d.completedTickets / closed) * 1000) / 10 : 0;

    return {
      serviceId: s.id,
      serviceName: s.name,
      branchId: s.branch.id,
      branchName: s.branch.name,
      totalTickets: d.totalTickets,
      completedTickets: d.completedTickets,
      cancelledTickets: d.cancelledTickets,
      avgWaitMinutes: waitStats.avg,
      medianWaitMinutes: waitStats.p50,
      p90WaitMinutes: waitStats.p90,
      avgServiceMinutes: serviceStats.avg,
      completionRate,
      sampleSize: d.totalTickets,
    };
  });
};

/**
 * 7. Branch Performance Metrics (Multi-branch Organization Comparison)
 */
export const getBranchPerformanceMetrics = async (
  organizationId: string,
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<BranchPerformanceMetric[]> => {
  const branches = await prisma.branch.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(filter.branchId ? { id: filter.branchId } : {}),
    },
    include: {
      queues: {
        select: {
          capacity: true,
          entries: {
            where: {
              joinedAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
            },
            select: {
              status: true,
              source: true,
              joinedAt: true,
              calledAt: true,
              servingAt: true,
              completedAt: true,
            },
          },
        },
      },
      appointments: {
        where: {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        select: { id: true },
      },
    },
  });

  return branches.map((b) => {
    let totalTickets = 0;
    let completedTickets = 0;
    let cancelledTickets = 0;
    let remoteJoinVolume = 0;
    let qrVolume = 0;
    let walkInVolume = 0;
    let kioskVolume = 0;
    const waitList: number[] = [];
    const serviceList: number[] = [];

    let totalCapacity = 0;
    let currentWaitingAndServing = 0;

    for (const q of b.queues) {
      totalCapacity += q.capacity || 50;
      for (const e of q.entries) {
        totalTickets++;
        if (e.status === EntryStatus.COMPLETED) completedTickets++;
        if (e.status === EntryStatus.CANCELLED) cancelledTickets++;
        if (e.status === EntryStatus.WAITING || e.status === EntryStatus.SERVING) {
          currentWaitingAndServing++;
        }

        switch (e.source) {
          case TicketSource.REMOTE:
            remoteJoinVolume++;
            break;
          case TicketSource.QR:
            qrVolume++;
            break;
          case TicketSource.WALK_IN:
          case TicketSource.STAFF_WALK_IN:
            walkInVolume++;
            break;
          case TicketSource.KIOSK:
            kioskVolume++;
            break;
        }

        if (e.calledAt) {
          waitList.push(Math.max(0, (e.calledAt.getTime() - e.joinedAt.getTime()) / 60000));
        }

        if (e.status === EntryStatus.COMPLETED && e.completedAt) {
          const start = e.servingAt || e.calledAt;
          if (start) {
            serviceList.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
          }
        }
      }
    }

    const waitStats = calculatePercentiles(waitList);
    const serviceStats = calculatePercentiles(serviceList);
    const closed = completedTickets + cancelledTickets;
    const completionRate = closed > 0 ? Math.round((completedTickets / closed) * 1000) / 10 : 0;
    const queueUtilization = totalCapacity > 0 ? Math.min(100, Math.round((currentWaitingAndServing / totalCapacity) * 1000) / 10) : 0;

    return {
      branchId: b.id,
      branchName: b.name,
      location: b.location,
      totalTickets,
      completedTickets,
      cancelledTickets,
      avgWaitMinutes: waitStats.avg,
      medianWaitMinutes: waitStats.p50,
      avgServiceMinutes: serviceStats.avg,
      queueUtilization,
      appointmentVolume: b.appointments.length,
      remoteJoinVolume,
      qrVolume,
      walkInVolume,
      kioskVolume,
      completionRate,
      sampleSize: totalTickets,
    };
  });
};

/**
 * 7b. Organization Performance Metrics (Platform-Wide Multi-Tenant Aggregated Analytics)
 * Enables Super Admin to analyze and compare all organizations across the network.
 */
export const getOrganizationPerformanceMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<OrganizationPerformanceMetric[]> => {
  const orgs = await prisma.organization.findMany({
    where: filter.organizationId ? { id: filter.organizationId } : undefined,
    include: {
      branches: {
        where: { isActive: true },
        select: {
          id: true,
          queues: {
            select: {
              entries: {
                where: {
                  joinedAt: {
                    gte: dateRange.startDate,
                    lte: dateRange.endDate,
                  },
                },
                select: {
                  status: true,
                  source: true,
                  joinedAt: true,
                  calledAt: true,
                  servingAt: true,
                  completedAt: true,
                },
              },
            },
          },
          appointments: {
            where: {
              createdAt: {
                gte: dateRange.startDate,
                lte: dateRange.endDate,
              },
            },
            select: { id: true },
          },
        },
      },
    },
  });

  return orgs.map((org) => {
    let totalTickets = 0;
    let completedTickets = 0;
    let cancelledTickets = 0;
    let remoteJoinVolume = 0;
    let qrVolume = 0;
    let walkInVolume = 0;
    let kioskVolume = 0;
    let appointmentVolume = 0;
    const waitList: number[] = [];
    const serviceList: number[] = [];

    for (const b of org.branches) {
      appointmentVolume += b.appointments.length;
      for (const q of b.queues) {
        for (const e of q.entries) {
          totalTickets++;
          if (e.status === EntryStatus.COMPLETED) completedTickets++;
          if (e.status === EntryStatus.CANCELLED) cancelledTickets++;

          switch (e.source) {
            case TicketSource.REMOTE:
              remoteJoinVolume++;
              break;
            case TicketSource.QR:
              qrVolume++;
              break;
            case TicketSource.WALK_IN:
            case TicketSource.STAFF_WALK_IN:
              walkInVolume++;
              break;
            case TicketSource.KIOSK:
              kioskVolume++;
              break;
          }

          if (e.calledAt) {
            waitList.push(Math.max(0, (e.calledAt.getTime() - e.joinedAt.getTime()) / 60000));
          }

          if (e.status === EntryStatus.COMPLETED && e.completedAt) {
            const start = e.servingAt || e.calledAt;
            if (start) {
              serviceList.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
            }
          }
        }
      }
    }

    const waitStats = calculatePercentiles(waitList);
    const serviceStats = calculatePercentiles(serviceList);
    const closed = completedTickets + cancelledTickets;
    const completionRate = closed > 0 ? Math.round((completedTickets / closed) * 1000) / 10 : 0;

    return {
      organizationId: org.id,
      organizationName: org.name,
      organizationType: org.type,
      totalBranches: org.branches.length,
      totalTickets,
      completedTickets,
      cancelledTickets,
      avgWaitMinutes: waitStats.avg,
      medianWaitMinutes: waitStats.p50,
      avgServiceMinutes: serviceStats.avg,
      appointmentVolume,
      remoteJoinVolume,
      qrVolume,
      walkInVolume,
      kioskVolume,
      completionRate,
      sampleSize: totalTickets,
    };
  });
};

/**
 * 8. Channel Analytics (REMOTE, QR, WALK_IN, KIOSK, STAFF_WALK_IN, APPOINTMENT)
 */
export const getChannelMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<ChannelMetric[]> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where,
    select: {
      source: true,
      status: true,
      joinedAt: true,
      calledAt: true,
      servingAt: true,
      completedAt: true,
    },
  });

  const total = entries.length;
  const channelDefinitions: Array<{ channel: string; label: string }> = [
    { channel: TicketSource.REMOTE, label: 'Mobile Remote Join' },
    { channel: TicketSource.QR, label: 'Branch QR Scan' },
    { channel: TicketSource.WALK_IN, label: 'Walk-In Customer' },
    { channel: TicketSource.KIOSK, label: 'Touchscreen Kiosk' },
    { channel: TicketSource.STAFF_WALK_IN, label: 'Staff Created Walk-In' },
    { channel: TicketSource.APPOINTMENT, label: 'Pre-Booked Appointment' },
  ];

  const map = new Map<string, {
    volume: number;
    completed: number;
    cancelled: number;
    waitList: number[];
    serviceList: number[];
  }>();

  for (const def of channelDefinitions) {
    map.set(def.channel, { volume: 0, completed: 0, cancelled: 0, waitList: [], serviceList: [] });
  }

  for (const e of entries) {
    const ch = e.source || TicketSource.REMOTE;
    if (!map.has(ch)) {
      map.set(ch, { volume: 0, completed: 0, cancelled: 0, waitList: [], serviceList: [] });
    }
    const d = map.get(ch)!;
    d.volume++;
    if (e.status === EntryStatus.COMPLETED) d.completed++;
    if (e.status === EntryStatus.CANCELLED) d.cancelled++;

    if (e.calledAt) {
      d.waitList.push(Math.max(0, (e.calledAt.getTime() - e.joinedAt.getTime()) / 60000));
    }
    if (e.status === EntryStatus.COMPLETED && e.completedAt) {
      const start = e.servingAt || e.calledAt;
      if (start) {
        d.serviceList.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
      }
    }
  }

  return channelDefinitions.map((def) => {
    const d = map.get(def.channel)!;
    const closed = d.completed + d.cancelled;
    const completionRate = closed > 0 ? Math.round((d.completed / closed) * 1000) / 10 : 0;
    const avgWait = d.waitList.length > 0 ? Math.round((d.waitList.reduce((a, b) => a + b, 0) / d.waitList.length) * 10) / 10 : 0;
    const avgService = d.serviceList.length > 0 ? Math.round((d.serviceList.reduce((a, b) => a + b, 0) / d.serviceList.length) * 10) / 10 : 0;
    const percentage = total > 0 ? Math.round((d.volume / total) * 1000) / 10 : 0;

    return {
      channel: def.channel,
      label: def.label,
      volume: d.volume,
      completedCount: d.completed,
      cancelledCount: d.cancelled,
      completionRate,
      avgWaitMinutes: avgWait,
      avgServiceMinutes: avgService,
      percentage,
    };
  });
};

/**
 * 9. Priority Usage Analytics (NORMAL, PRIORITY, APPOINTMENT)
 */
export const getPriorityMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<PriorityMetric[]> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where,
    select: {
      priority: true,
      status: true,
      joinedAt: true,
      calledAt: true,
      servingAt: true,
      completedAt: true,
    },
  });

  const total = entries.length;
  const priorityDefs: Array<{ priority: PriorityLevel; label: string }> = [
    { priority: PriorityLevel.NORMAL, label: 'Standard Normal' },
    { priority: PriorityLevel.PRIORITY, label: 'VIP / Expedited Priority' },
    { priority: PriorityLevel.APPOINTMENT, label: 'Scheduled Appointment' },
  ];

  const map = new Map<PriorityLevel, { volume: number; completed: number; waitList: number[]; serviceList: number[] }>();
  for (const def of priorityDefs) {
    map.set(def.priority, { volume: 0, completed: 0, waitList: [], serviceList: [] });
  }

  for (const e of entries) {
    const p = e.priority || PriorityLevel.NORMAL;
    if (map.has(p)) {
      const d = map.get(p)!;
      d.volume++;
      if (e.status === EntryStatus.COMPLETED) d.completed++;
      if (e.calledAt) {
        d.waitList.push(Math.max(0, (e.calledAt.getTime() - e.joinedAt.getTime()) / 60000));
      }
      if (e.status === EntryStatus.COMPLETED && e.completedAt) {
        const start = e.servingAt || e.calledAt;
        if (start) {
          d.serviceList.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
        }
      }
    }
  }

  return priorityDefs.map((def) => {
    const d = map.get(def.priority)!;
    const avgWait = d.waitList.length > 0 ? Math.round((d.waitList.reduce((a, b) => a + b, 0) / d.waitList.length) * 10) / 10 : 0;
    const avgService = d.serviceList.length > 0 ? Math.round((d.serviceList.reduce((a, b) => a + b, 0) / d.serviceList.length) * 10) / 10 : 0;
    const percentage = total > 0 ? Math.round((d.volume / total) * 1000) / 10 : 0;

    return {
      priority: def.priority,
      label: def.label,
      volume: d.volume,
      completedCount: d.completed,
      avgWaitMinutes: avgWait,
      avgServiceMinutes: avgService,
      percentage,
    };
  });
};

/**
 * 10. Service Transfer Analytics (Patterns, Rates, Durations)
 */
export const getTransferMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<TransferMetric> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  // Find all entries in this period that were transferred
  const transferredEntries = await prisma.queueEntry.findMany({
    where: {
      ...where,
      OR: [
        { transferredAt: { not: null } },
        { transferredFromEntryId: { not: null } },
      ],
    },
    include: {
      queue: { include: { service: true } },
      transferredFromEntry: {
        include: { queue: { include: { service: true } } },
      },
    },
  });

  const totalEntriesCount = await prisma.queueEntry.count({ where });
  const totalTransfers = transferredEntries.length;
  const transferRate = totalEntriesCount > 0
    ? Math.round((totalTransfers / totalEntriesCount) * 1000) / 10
    : 0;

  const timeBeforeList: number[] = [];
  const timeAfterList: number[] = [];
  let completedAfterTransferCount = 0;

  const originalServiceIds = transferredEntries
    .map((e) => e.originalServiceId)
    .filter((id): id is string => Boolean(id));

  const origServices = originalServiceIds.length > 0
    ? await prisma.service.findMany({
        where: { id: { in: originalServiceIds } },
        select: { id: true, name: true },
      })
    : [];
  const origServiceMap = new Map(origServices.map((s) => [s.id, s.name]));
  const flowMap = new Map<string, TransferFlowPattern>();

  for (const entry of transferredEntries) {
    if (entry.status === EntryStatus.COMPLETED) {
      completedAfterTransferCount++;
    }

    if (entry.transferredAt) {
      const beforeMinutes = (entry.transferredAt.getTime() - entry.joinedAt.getTime()) / 60000;
      timeBeforeList.push(Math.max(0, beforeMinutes));

      if (entry.completedAt) {
        const afterMinutes = (entry.completedAt.getTime() - entry.transferredAt.getTime()) / 60000;
        timeAfterList.push(Math.max(0, afterMinutes));
      }
    }

    // Pattern recognition (Source Service -> Destination Service)
    const sourceServiceId = entry.originalServiceId || entry.transferredFromEntry?.queue?.serviceId;
    const sourceServiceName =
      entry.transferredFromEntry?.queue?.service?.name ||
      (entry.originalServiceId ? origServiceMap.get(entry.originalServiceId) : null) ||
      'Initial Service';
    const destServiceId = entry.queue.serviceId;
    const destServiceName = entry.queue.service.name;

    if (sourceServiceId && destServiceId && sourceServiceId !== destServiceId) {
      const flowKey = `${sourceServiceId}->${destServiceId}`;
      if (!flowMap.has(flowKey)) {
        flowMap.set(flowKey, {
          sourceServiceId,
          sourceServiceName,
          destServiceId,
          destServiceName,
          transferCount: 0,
        });
      }
      flowMap.get(flowKey)!.transferCount++;
    }
  }

  const avgTimeBefore = timeBeforeList.length > 0
    ? Math.round((timeBeforeList.reduce((a, b) => a + b, 0) / timeBeforeList.length) * 10) / 10
    : 0;

  const avgTimeAfter = timeAfterList.length > 0
    ? Math.round((timeAfterList.reduce((a, b) => a + b, 0) / timeAfterList.length) * 10) / 10
    : 0;

  return {
    totalTransfers,
    transferRate,
    avgTimeBeforeTransferMinutes: avgTimeBefore,
    avgTimeAfterTransferMinutes: avgTimeAfter,
    completedAfterTransferCount,
    flowPatterns: Array.from(flowMap.values()).sort((a, b) => b.transferCount - a.transferCount),
  };
};

/**
 * 11. Queue Congestion Metrics (Status, Thresholds, Utilization)
 */
export const getQueueCongestionMetrics = async (
  filter: AnalyticsFilterParams
): Promise<QueueCongestionMetric> => {
  const queueWhere: any = {};
  if (filter.serviceId) {
    queueWhere.serviceId = filter.serviceId;
  } else if (filter.branchId) {
    queueWhere.branchId = filter.branchId;
  } else if (filter.organizationId) {
    queueWhere.branch = { organizationId: filter.organizationId };
  }

  const activeQueues = await prisma.queue.findMany({
    where: { ...queueWhere, status: 'OPEN' },
    select: {
      id: true,
      servingCapacity: true,
      capacity: true,
      entries: {
        where: { status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] } },
        select: { id: true, status: true, joinedAt: true },
      },
    },
  });

  let totalWaitingCount = 0;
  let totalServingCount = 0;
  let totalServingCapacity = 0;
  let totalQueueCapacity = 0;
  const currentWaitList: number[] = [];
  const now = new Date();

  for (const q of activeQueues) {
    totalServingCapacity += q.servingCapacity || 1;
    totalQueueCapacity += q.capacity || 50;

    for (const e of q.entries) {
      if (e.status === EntryStatus.WAITING) {
        totalWaitingCount++;
        currentWaitList.push(Math.max(0, (now.getTime() - e.joinedAt.getTime()) / 60000));
      } else {
        totalServingCount++;
      }
    }
  }

  // Active counters
  const counterWhere: any = { isActive: true };
  if (filter.branchId) counterWhere.branchId = filter.branchId;
  else if (filter.organizationId) counterWhere.branch = { organizationId: filter.organizationId };

  const activeCounters = await prisma.serviceCounter.count({
    where: { ...counterWhere, status: 'SERVING' },
  }).catch(() => 0);

  // Arrival and Completion rates over last 60 minutes
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const entryScopeWhere: any = {};
  if (filter.serviceId) entryScopeWhere.queue = { serviceId: filter.serviceId };
  else if (filter.branchId) entryScopeWhere.queue = { branchId: filter.branchId };
  else if (filter.organizationId) entryScopeWhere.queue = { branch: { organizationId: filter.organizationId } };

  const [arrivalRatePerHour, completionRatePerHour] = await Promise.all([
    prisma.queueEntry.count({
      where: {
        ...entryScopeWhere,
        joinedAt: { gte: oneHourAgo },
      },
    }),
    prisma.queueEntry.count({
      where: {
        ...entryScopeWhere,
        status: EntryStatus.COMPLETED,
        completedAt: { gte: oneHourAgo },
      },
    }),
  ]);

  const avgCurrentWaitMinutes = currentWaitList.length > 0
    ? Math.round((currentWaitList.reduce((a, b) => a + b, 0) / currentWaitList.length) * 10) / 10
    : 0;

  const capacityUtilization = totalQueueCapacity > 0
    ? Math.min(100, Math.round(((totalWaitingCount + totalServingCount) / totalQueueCapacity) * 1000) / 10)
    : 0;

  // Determine Congestion Status according to measurable documented thresholds
  let status: QueueCongestionStatus = 'NORMAL';
  let thresholdExplanation: string = ANALYTICS_DEFINITIONS.CONGESTION.NORMAL.description;

  if (
    totalWaitingCount > ANALYTICS_DEFINITIONS.CONGESTION.BUSY.maxWaitingCount ||
    avgCurrentWaitMinutes >= ANALYTICS_DEFINITIONS.CONGESTION.HIGH_LOAD.minAvgWaitMinutes ||
    capacityUtilization >= ANALYTICS_DEFINITIONS.CONGESTION.HIGH_LOAD.minCapacityUtilizationPercent
  ) {
    status = 'HIGH_LOAD';
    thresholdExplanation = ANALYTICS_DEFINITIONS.CONGESTION.HIGH_LOAD.description;
  } else if (
    totalWaitingCount >= ANALYTICS_DEFINITIONS.CONGESTION.BUSY.minWaitingCount ||
    avgCurrentWaitMinutes >= ANALYTICS_DEFINITIONS.CONGESTION.BUSY.minAvgWaitMinutes ||
    capacityUtilization >= ANALYTICS_DEFINITIONS.CONGESTION.BUSY.minCapacityUtilizationPercent
  ) {
    status = 'BUSY';
    thresholdExplanation = ANALYTICS_DEFINITIONS.CONGESTION.BUSY.description;
  }

  return {
    status,
    waitingCount: totalWaitingCount,
    avgCurrentWaitMinutes,
    servingCapacity: totalServingCapacity,
    capacityUtilization,
    arrivalRatePerHour,
    completionRatePerHour,
    activeCounters,
    thresholdExplanation,
  };
};

/**
 * 12. Real-Time Operations Snapshot
 */
export const getRealTimeOperationsSnapshot = async (
  filter: AnalyticsFilterParams
): Promise<RealTimeOperationsSnapshot> => {
  const queueWhere: any = {};
  let branchName: string | undefined;

  if (filter.branchId) {
    queueWhere.branchId = filter.branchId;
    const branch = await prisma.branch.findUnique({ where: { id: filter.branchId }, select: { name: true } });
    branchName = branch?.name;
  } else if (filter.organizationId) {
    queueWhere.branch = { organizationId: filter.organizationId };
  }

  const [queues, counters] = await Promise.all([
    prisma.queue.findMany({
      where: queueWhere,
      select: {
        id: true,
        status: true,
        capacity: true,
        entries: {
          where: { status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] } },
          select: { id: true, status: true, joinedAt: true },
        },
      },
    }),
    prisma.serviceCounter.findMany({
      where: filter.branchId ? { branchId: filter.branchId } : {},
      select: { status: true },
    }).catch(() => []),
  ]);

  let currentlyWaiting = 0;
  let currentlyServing = 0;
  let totalCapacity = 0;
  const waitDurations: number[] = [];
  const now = new Date();

  for (const q of queues) {
    totalCapacity += q.capacity || 50;
    for (const e of q.entries) {
      if (e.status === EntryStatus.WAITING) {
        currentlyWaiting++;
        waitDurations.push(Math.max(0, (now.getTime() - e.joinedAt.getTime()) / 60000));
      } else {
        currentlyServing++;
      }
    }
  }

  const openQueues = queues.filter((q) => q.status === 'OPEN').length;
  const totalQueues = queues.length;
  const activeCounters = counters.filter((c: any) => c.status === 'SERVING').length;
  const totalCounters = counters.length;

  const averageCurrentWaitMinutes = waitDurations.length > 0
    ? Math.round((waitDurations.reduce((a, b) => a + b, 0) / waitDurations.length) * 10) / 10
    : 0;

  const longestCurrentWaitMinutes = waitDurations.length > 0
    ? Math.round(Math.max(...waitDurations) * 10) / 10
    : 0;

  const queueCapacityUtilization = totalCapacity > 0
    ? Math.min(100, Math.round(((currentlyWaiting + currentlyServing) / totalCapacity) * 1000) / 10)
    : 0;

  let congestionStatus: QueueCongestionStatus = 'NORMAL';
  if (currentlyWaiting > 15 || averageCurrentWaitMinutes > 30 || queueCapacityUtilization >= 90) {
    congestionStatus = 'HIGH_LOAD';
  } else if (currentlyWaiting >= 6 || averageCurrentWaitMinutes >= 16 || queueCapacityUtilization >= 70) {
    congestionStatus = 'BUSY';
  }

  return {
    branchId: filter.branchId,
    branchName,
    organizationId: filter.organizationId,
    currentlyWaiting,
    currentlyServing,
    averageCurrentWaitMinutes,
    longestCurrentWaitMinutes,
    activeCounters,
    totalCounters,
    openQueues,
    totalQueues,
    queueCapacityUtilization,
    congestionStatus,
    lastUpdated: now.toISOString(),
  };
};

/**
 * 13. Staff Performance Analytics (Strictly factual metrics with sample sizes, NO ranking/best-worst)
 */
export const getStaffPerformanceMetrics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<StaffPerformanceMetric[]> => {
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where: {
      ...where,
      servedByStaffId: { not: null },
    },
    select: {
      servedByStaffId: true,
      status: true,
      servingAt: true,
      calledAt: true,
      completedAt: true,
      queue: {
        select: {
          branch: {
            select: {
              id: true,
              name: true,
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const staffMap = new Map<string, {
    branchId: string;
    branchName?: string;
    organizationName?: string;
    served: number;
    completed: number;
    durations: number[];
  }>();

  for (const e of entries) {
    const sId = e.servedByStaffId!;
    const branch = e.queue?.branch;
    if (!staffMap.has(sId)) {
      staffMap.set(sId, {
        branchId: branch?.id || '',
        branchName: branch?.name,
        organizationName: branch?.organization?.name,
        served: 0,
        completed: 0,
        durations: [],
      });
    }
    const data = staffMap.get(sId)!;
    data.served++;
    if (e.status === EntryStatus.COMPLETED && e.completedAt) {
      data.completed++;
      const start = e.servingAt || e.calledAt;
      if (start) {
        data.durations.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
      }
    }
  }

  const staffIds = Array.from(staffMap.keys());
  const users = await prisma.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, fullName: true, email: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return staffIds.map((sId) => {
    const d = staffMap.get(sId)!;
    const u = userMap.get(sId);
    const totalMinutes = d.durations.reduce((acc, c) => acc + c, 0);
    const avgDuration = d.durations.length > 0 ? Math.round((totalMinutes / d.durations.length) * 10) / 10 : 0;

    return {
      staffId: sId,
      staffName: u?.fullName || 'Staff Agent',
      email: u?.email,
      role: u?.role,
      branchId: d.branchId,
      branchName: d.branchName,
      organizationName: d.organizationName,
      ticketsServed: d.served,
      ticketsCompleted: d.completed,
      avgServiceDurationMinutes: avgDuration,
      activeServingMinutes: Math.round(totalMinutes),
      sampleSize: d.durations.length,
    };
  });
};

/**
 * 14. Counter Utilization Analytics
 */
export const getCounterAnalytics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<CounterAnalyticsMetric[]> => {
  const counterWhere: any = {};
  if (filter.branchId) counterWhere.branchId = filter.branchId;
  else if (filter.organizationId) counterWhere.branch = { organizationId: filter.organizationId };

  const counters = await prisma.serviceCounter.findMany({
    where: counterWhere,
  }).catch(() => []);

  const entryWhere = buildQueueEntryWhereClause(filter, dateRange);
  const entries = await prisma.queueEntry.findMany({
    where: {
      ...entryWhere,
      counterNumber: { not: null },
    },
    select: {
      counterNumber: true,
      status: true,
      servingAt: true,
      calledAt: true,
      completedAt: true,
    },
  });

  const counterMap = new Map<string, { served: number; durations: number[] }>();
  for (const c of counters) {
    counterMap.set(c.counterNumber, { served: 0, durations: [] });
  }

  for (const e of entries) {
    if (e.counterNumber && counterMap.has(e.counterNumber)) {
      const d = counterMap.get(e.counterNumber)!;
      d.served++;
      if (e.status === EntryStatus.COMPLETED && e.completedAt) {
        const start = e.servingAt || e.calledAt;
        if (start) {
          d.durations.push(Math.max(0, (e.completedAt.getTime() - start.getTime()) / 60000));
        }
      }
    }
  }

  return counters.map((c: any) => {
    const d = counterMap.get(c.counterNumber) || { served: 0, durations: [] };
    const avg = d.durations.length > 0
      ? Math.round((d.durations.reduce((a, b) => a + b, 0) / d.durations.length) * 10) / 10
      : 0;

    return {
      counterId: c.id,
      counterNumber: c.counterNumber,
      branchId: c.branchId,
      status: c.status,
      ticketsServed: d.served,
      avgServiceMinutes: avg,
      sampleSize: d.durations.length,
    };
  });
};

/**
 * 15. Appointment Analytics
 */
export const getAppointmentAnalytics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<AppointmentAnalyticsMetric> => {
  const where: any = {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };

  if (filter.serviceId) where.serviceId = filter.serviceId;
  else if (filter.branchId) where.branchId = filter.branchId;
  else if (filter.organizationId) where.branch = { organizationId: filter.organizationId };

  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      status: true,
      fee: true,
      createdAt: true,
      scheduledTime: true,
      approvedAt: true,
      paidAt: true,
      startedAt: true,
      completedAt: true,
      rejectionReason: true,
      followUpStatus: true,
    },
  });

  const totalAppointments = appointments.length;
  let pending = 0;
  let approved = 0;
  let confirmed = 0;
  let rejected = 0;
  let completed = 0;
  let cancelled = 0;
  let paid = 0;
  let unpaid = 0;

  const approvalDurations: number[] = [];
  const startDurations: number[] = [];
  const resolutionDurations: number[] = [];

  const reasonCounts = new Map<string, number>();

  const followUps = {
    requested: 0,
    inReview: 0,
    directedToBranch: 0,
    resolved: 0,
    resolutionRate: 0,
  };

  let approvedCountForRate = 0;

  for (const app of appointments) {
    if (app.paidAt || (app.fee && Number(app.fee) > 0 && app.status === 'PAID')) {
      paid++;
    } else {
      unpaid++;
    }

    if (app.approvedAt || ['APPROVED', 'CONFIRMED', 'COMPLETED', 'PAID', 'IN_PROGRESS'].includes(app.status)) {
      approvedCountForRate++;
    }

    switch (app.status) {
      case 'PENDING':
        pending++;
        break;
      case 'APPROVED':
        approved++;
        break;
      case 'CONFIRMED':
        confirmed++;
        break;
      case 'REJECTED':
        rejected++;
        if (app.rejectionReason) {
          const reason = app.rejectionReason.trim();
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        }
        break;
      case 'COMPLETED':
        completed++;
        break;
      case 'CANCELLED':
        cancelled++;
        break;
    }

    if (app.approvedAt) {
      approvalDurations.push(Math.max(0, (app.approvedAt.getTime() - app.createdAt.getTime()) / 60000));
    }
    if (app.startedAt && app.scheduledTime) {
      startDurations.push(Math.max(0, (app.startedAt.getTime() - app.scheduledTime.getTime()) / 60000));
    }
    if (app.completedAt && app.startedAt) {
      resolutionDurations.push(Math.max(0, (app.completedAt.getTime() - app.startedAt.getTime()) / 60000));
    }

    if (app.followUpStatus) {
      switch (app.followUpStatus) {
        case 'REQUESTED':
          followUps.requested++;
          break;
        case 'IN_REVIEW':
          followUps.inReview++;
          break;
        case 'DIRECTED_TO_BRANCH':
          followUps.directedToBranch++;
          break;
        case 'RESOLVED':
          followUps.resolved++;
          break;
      }
    }
  }

  const evaluated = approvedCountForRate + rejected;
  const approvalRate = evaluated > 0 ? Math.round((approvedCountForRate / evaluated) * 1000) / 10 : 0;
  const rejectionRate = evaluated > 0 ? Math.round((rejected / evaluated) * 1000) / 10 : 0;
  const completedOrCancelled = completed + cancelled;
  const completionRate = completedOrCancelled > 0 ? Math.round((completed / completedOrCancelled) * 1000) / 10 : 0;

  const totalFollowUps = followUps.requested + followUps.inReview + followUps.directedToBranch + followUps.resolved;
  followUps.resolutionRate = totalFollowUps > 0 ? Math.round((followUps.resolved / totalFollowUps) * 1000) / 10 : 0;

  const avgTimeToApproval = approvalDurations.length > 0
    ? Math.round((approvalDurations.reduce((a, b) => a + b, 0) / approvalDurations.length) * 10) / 10
    : 0;

  const avgTimeToStart = startDurations.length > 0
    ? Math.round((startDurations.reduce((a, b) => a + b, 0) / startDurations.length) * 10) / 10
    : 0;

  const avgResolutionDuration = resolutionDurations.length > 0
    ? Math.round((resolutionDurations.reduce((a, b) => a + b, 0) / resolutionDurations.length) * 10) / 10
    : 0;

  const rejectionReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalAppointments,
    pending,
    approved,
    confirmed,
    rejected,
    completed,
    cancelled,
    paid,
    unpaid,
    approvalRate,
    completionRate,
    rejectionRate,
    avgTimeToApprovalMinutes: avgTimeToApproval,
    avgTimeToStartMinutes: avgTimeToStart,
    avgResolutionDurationMinutes: avgResolutionDuration,
    rejectionReasons,
    followUps,
    sampleSize: totalAppointments,
  };
};

/**
 * 16. Communication & Notification Analytics
 */
export const getCommunicationAnalytics = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<CommunicationAnalyticsMetric> => {
  const notifWhere: any = {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };
  if (filter.branchId) notifWhere.branchId = filter.branchId;
  else if (filter.organizationId) notifWhere.organizationId = filter.organizationId;

  // Deliveries grouped by channel
  const deliveries = await prisma.notificationDelivery.findMany({
    where: {
      notification: notifWhere,
    },
    select: {
      channel: true,
      status: true,
    },
  });

  const channelMap = new Map<string, { total: number; delivered: number; opened: number; failed: number }>();
  let totalDeliveries = deliveries.length;
  let sentDeliveries = 0;
  let deliveredDeliveries = 0;
  let openedDeliveries = 0;
  let failedDeliveries = 0;

  for (const d of deliveries) {
    const ch = d.channel;
    if (!channelMap.has(ch)) {
      channelMap.set(ch, { total: 0, delivered: 0, opened: 0, failed: 0 });
    }
    const cData = channelMap.get(ch)!;
    cData.total++;

    if (d.status === DeliveryStatus.SENT || d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.OPENED) {
      sentDeliveries++;
    }
    if (d.status === DeliveryStatus.DELIVERED || d.status === DeliveryStatus.OPENED) {
      deliveredDeliveries++;
      cData.delivered++;
    }
    if (d.status === DeliveryStatus.OPENED) {
      openedDeliveries++;
      cData.opened++;
    }
    if (d.status === DeliveryStatus.FAILED) {
      failedDeliveries++;
      cData.failed++;
    }
  }

  const deliveryRate = sentDeliveries > 0 ? Math.round((deliveredDeliveries / sentDeliveries) * 1000) / 10 : 0;
  const openRate = deliveredDeliveries > 0 ? Math.round((openedDeliveries / deliveredDeliveries) * 1000) / 10 : 0;

  // Callbacks
  const callbackWhere: any = {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };
  if (filter.branchId) callbackWhere.branchId = filter.branchId;
  else if (filter.organizationId) callbackWhere.organizationId = filter.organizationId;

  const callbacks = await prisma.callbackRequest.findMany({
    where: callbackWhere,
    select: { status: true },
  });

  let triggeredCallbacks = 0;
  let acknowledgedCallbacks = 0;
  let cancelledCallbacks = 0;
  let expiredCallbacks = 0;

  for (const cb of callbacks) {
    if (cb.status === CallbackStatus.TRIGGERED) triggeredCallbacks++;
    if (cb.status === CallbackStatus.ACKNOWLEDGED) {
      triggeredCallbacks++;
      acknowledgedCallbacks++;
    }
    if (cb.status === CallbackStatus.CANCELLED) cancelledCallbacks++;
    if (cb.status === CallbackStatus.EXPIRED) expiredCallbacks++;
  }

  const acknowledgementRate = triggeredCallbacks > 0
    ? Math.round((acknowledgedCallbacks / triggeredCallbacks) * 1000) / 10
    : 0;

  // Messaging Conversations
  const convWhere: any = {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    },
  };
  if (filter.branchId) convWhere.branchId = filter.branchId;
  else if (filter.organizationId) convWhere.organizationId = filter.organizationId;

  const conversations = await prisma.conversation.findMany({
    where: convWhere,
    select: {
      id: true,
      messages: {
        select: {
          senderType: true,
          isRead: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  let totalMessages = 0;
  let readMessages = 0;
  const responseTimes: number[] = [];

  for (const conv of conversations) {
    totalMessages += conv.messages.length;
    for (let i = 0; i < conv.messages.length; i++) {
      const msg = conv.messages[i];
      if (msg.isRead) readMessages++;

      // Response time: customer message followed by staff message
      if (msg.senderType === 'CUSTOMER' && i + 1 < conv.messages.length) {
        const nextMsg = conv.messages[i + 1];
        if (nextMsg.senderType === 'STAFF') {
          const diffMinutes = (nextMsg.createdAt.getTime() - msg.createdAt.getTime()) / 60000;
          responseTimes.push(Math.max(0, diffMinutes));
        }
      }
    }
  }

  const avgResponseTimeMinutes = responseTimes.length > 0
    ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 10) / 10
    : 0;

  return {
    notifications: {
      total: totalDeliveries,
      sent: sentDeliveries,
      delivered: deliveredDeliveries,
      opened: openedDeliveries,
      failed: failedDeliveries,
      deliveryRate,
      openRate,
      byChannel: Array.from(channelMap.entries()).map(([channel, data]) => ({
        channel,
        total: data.total,
        delivered: data.delivered,
        opened: data.opened,
        failed: data.failed,
      })),
    },
    callbacks: {
      total: callbacks.length,
      triggered: triggeredCallbacks,
      acknowledged: acknowledgedCallbacks,
      cancelled: cancelledCallbacks,
      expired: expiredCallbacks,
      acknowledgementRate,
    },
    messages: {
      conversationsCreated: conversations.length,
      messagesSent: totalMessages,
      messagesRead: readMessages,
      avgResponseTimeMinutes,
    },
  };
};

/**
 * 16b. System-Wide Queue Roster & Operational Health (Super Admin & Org Admin)
 */
export const getSystemQueues = async (
  filter: AnalyticsFilterParams
): Promise<SystemQueueMetric[]> => {
  try {
    const queueWhere: any = {};
    if (filter.serviceId) {
      queueWhere.serviceId = filter.serviceId;
    } else if (filter.branchId) {
      queueWhere.branchId = filter.branchId;
    } else if (filter.organizationId) {
      queueWhere.branch = { organizationId: filter.organizationId };
    }

    const queues = await prisma.queue.findMany({
      where: queueWhere,
      include: {
        service: { select: { name: true } },
        branch: {
          select: {
            id: true,
            name: true,
            organization: { select: { id: true, name: true } },
          },
        },
        entries: {
          where: { status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] } },
          select: { id: true, status: true, joinedAt: true },
        },
      },
    });

    const now = new Date();
    const result: SystemQueueMetric[] = queues.map((q) => {
      let waiting = 0;
      let serving = 0;
      const waitTimes: number[] = [];
      for (const e of q.entries || []) {
        if (e.status === EntryStatus.WAITING) {
          waiting++;
          waitTimes.push(Math.max(0, (now.getTime() - e.joinedAt.getTime()) / 60000));
        } else {
          serving++;
        }
      }
      const cap = q.capacity || 50;
      const util = Math.min(100, Math.round(((waiting + serving) / cap) * 1000) / 10);
      const avgWait = waitTimes.length > 0
        ? Math.round((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) * 10) / 10
        : 0;

      return {
        queueId: q.id,
        queueName: `${q.service?.name || 'Queue'}`,
        serviceId: q.serviceId,
        serviceName: q.service?.name || 'General Service',
        branchId: q.branch?.id || q.branchId,
        branchName: q.branch?.name || 'Main Branch',
        organizationId: q.branch?.organization?.id || '',
        organizationName: q.branch?.organization?.name || 'Organization',
        status: q.status,
        capacity: cap,
        waitingCount: waiting,
        servingCount: serving,
        utilizationPercent: util,
        avgWaitMinutes: avgWait,
      };
    });

    result.sort((a, b) => {
      const orgCmp = (a.organizationName || '').localeCompare(b.organizationName || '');
      if (orgCmp !== 0) return orgCmp;
      const branchCmp = (a.branchName || '').localeCompare(b.branchName || '');
      if (branchCmp !== 0) return branchCmp;
      return (a.serviceName || '').localeCompare(b.serviceName || '');
    });

    return result;
  } catch (error) {
    console.error('Error fetching system queues:', error);
    return [];
  }
};

/**
 * 16c. Platform Administrative & Staff User Intelligence (Super Admin & Org Admin)
 */
export const getPlatformUsers = async (
  filter: AnalyticsFilterParams,
  dateRange: { startDate: Date; endDate: Date }
): Promise<PlatformUserMetric[]> => {
  try {
    const userWhere: any = {};
    if (filter.organizationId) {
      userWhere.organizationId = filter.organizationId;
    }
    if (filter.branchId) {
      userWhere.OR = [
        { staffBranchId: filter.branchId },
        { managedBranches: { some: { id: filter.branchId } } },
      ];
    }

    const [users, staffEntries] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          organizationId: true,
          organization: { select: { name: true } },
          staffBranchId: true,
          staffBranch: { select: { name: true } },
          createdAt: true,
        },
        orderBy: [
          { role: 'asc' },
          { fullName: 'asc' },
        ],
      }),
      prisma.queueEntry.findMany({
        where: {
          servedByStaffId: { not: null },
          joinedAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        },
        select: {
          servedByStaffId: true,
          status: true,
        },
      }).catch(() => []),
    ]);

    const activityMap = new Map<string, { served: number; completed: number }>();
    for (const act of staffEntries) {
      if (!act.servedByStaffId) continue;
      if (!activityMap.has(act.servedByStaffId)) {
        activityMap.set(act.servedByStaffId, { served: 0, completed: 0 });
      }
      const cur = activityMap.get(act.servedByStaffId)!;
      cur.served++;
      if (act.status === EntryStatus.COMPLETED) {
        cur.completed++;
      }
    }

    return users.map((u) => {
      const act = activityMap.get(u.id) || { served: 0, completed: 0 };
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        organizationId: u.organizationId || undefined,
        organizationName: u.organization?.name || (u.role === 'SUPER_ADMIN' ? 'Platform Core' : undefined),
        branchId: u.staffBranchId || undefined,
        branchName: u.staffBranch?.name || undefined,
        createdAt: u.createdAt.toISOString(),
        ticketsServed: act.served,
        ticketsCompleted: act.completed,
        isActive: true,
      };
    });
  } catch (error) {
    console.error('Error fetching platform users:', error);
    return [];
  }
};

/**
 * 17. Comprehensive Enterprise Analytics Dashboard Aggregator
 */
export const getComprehensiveDashboard = async (
  filter: AnalyticsFilterParams,
  reqUser?: any
): Promise<ComprehensiveAnalyticsDashboardData> => {
  const dateRange = resolveDateRange(filter.dateRange, filter.startDate, filter.endDate, filter.timezone);
  const isSuperAdmin = !reqUser || reqUser.role === Role.SUPER_ADMIN;
  const isStaff = reqUser?.role === Role.STAFF;

  const [
    overview,
    hourlyDemand,
    dayOfWeek,
    services,
    branches,
    organizations,
    channels,
    priorities,
    transfers,
    congestion,
    realtime,
    appointments,
    communication,
    staff,
    counters,
    systemQueues,
    platformUsers,
  ] = await Promise.all([
    getQueueLifecycleMetrics(filter, dateRange).catch((err) => {
      console.error('Error in getQueueLifecycleMetrics:', err);
      return {
        totalTickets: 0,
        waitingTickets: 0,
        servingTickets: 0,
        completedTickets: 0,
        cancelledTickets: 0,
        skippedTickets: 0,
        absentTickets: 0,
        transferredTickets: 0,
        completionRate: 0,
        cancellationRate: 0,
        abandonmentRate: 0,
        waitTimeMinutes: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0, min: 0, max: 0, sampleSize: 0, isLowSample: true },
        serviceTimeMinutes: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0, min: 0, max: 0, sampleSize: 0, isLowSample: true },
        totalJourneyTimeMinutes: { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, mean: 0, min: 0, max: 0, sampleSize: 0, isLowSample: true },
      };
    }),
    getHourlyDemandMetrics(filter, dateRange).catch(() => []),
    getDayOfWeekMetrics(filter, dateRange).catch(() => []),
    getServicePerformanceMetrics(filter, dateRange).catch(() => []),
    (!isStaff && filter.organizationId && !filter.branchId)
      ? getBranchPerformanceMetrics(filter.organizationId, filter, dateRange).catch(() => [])
      : Promise.resolve(undefined),
    (isSuperAdmin && !filter.organizationId)
      ? getOrganizationPerformanceMetrics(filter, dateRange).catch(() => [])
      : Promise.resolve(undefined),
    getChannelMetrics(filter, dateRange).catch(() => []),
    !isStaff ? getPriorityMetrics(filter, dateRange).catch(() => []) : Promise.resolve(undefined),
    !isStaff ? getTransferMetrics(filter, dateRange).catch(() => ({ totalTransfers: 0, transferRate: 0, avgTimeBeforeTransferMinutes: 0, avgTimeAfterTransferMinutes: 0, completedAfterTransferCount: 0, flowPatterns: [] })) : Promise.resolve(undefined),
    getQueueCongestionMetrics(filter).catch(() => ({ status: 'NORMAL' as const, waitingCount: 0, avgCurrentWaitMinutes: 0, servingCapacity: 1, capacityUtilization: 0, arrivalRatePerHour: 0, completionRatePerHour: 0, activeCounters: 0, thresholdExplanation: 'Operational metrics within normal baseline.' })),
    getRealTimeOperationsSnapshot(filter).catch(() => ({ currentlyWaiting: 0, currentlyServing: 0, averageCurrentWaitMinutes: 0, longestCurrentWaitMinutes: 0, activeCounters: 0, totalCounters: 0, openQueues: 0, totalQueues: 0, queueCapacityUtilization: 0, congestionStatus: 'NORMAL' as const, lastUpdated: new Date().toISOString() })),
    !isStaff ? getAppointmentAnalytics(filter, dateRange).catch(() => undefined) : Promise.resolve(undefined),
    !isStaff ? getCommunicationAnalytics(filter, dateRange).catch(() => undefined) : Promise.resolve(undefined),
    !isStaff ? getStaffPerformanceMetrics(filter, dateRange).catch(() => []) : Promise.resolve(undefined),
    getCounterAnalytics(filter, dateRange).catch(() => []),
    !isStaff ? getSystemQueues(filter).catch(() => []) : Promise.resolve(undefined),
    !isStaff ? getPlatformUsers(filter, dateRange).catch(() => []) : Promise.resolve(undefined),
  ]);

  return {
    filters: {
      organizationId: filter.organizationId,
      branchId: filter.branchId,
      serviceId: filter.serviceId,
      dateRange: dateRange.rangeKey,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      timezone: filter.timezone || 'UTC',
    },
    overview,
    hourlyDemand,
    dayOfWeek,
    services,
    branches,
    organizations,
    channels,
    priorities,
    transfers,
    congestion,
    realtime,
    appointments,
    communication,
    staff,
    counters,
    systemQueues,
    platformUsers,
  };
};

/**
 * 18. Tenant-Safe, Filter-Aware CSV Export Generator
 */
export const exportAnalyticsToCsv = async (
  filter: AnalyticsFilterParams
): Promise<string> => {
  const dateRange = resolveDateRange(filter.dateRange, filter.startDate, filter.endDate, filter.timezone);
  const where = buildQueueEntryWhereClause(filter, dateRange);

  const entries = await prisma.queueEntry.findMany({
    where,
    orderBy: { joinedAt: 'asc' },
    include: {
      queue: {
        include: {
          service: { select: { name: true } },
          branch: { select: { name: true } },
        },
      },
      user: { select: { fullName: true } },
    },
  });

  const escapeCsv = (str: any): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = [
    'Ticket Number',
    'Branch',
    'Service',
    'Customer Name',
    'Priority',
    'Source Channel',
    'Counter',
    'Status',
    'Joined At',
    'Called At',
    'Serving At',
    'Completed At',
    'Wait Time (Mins)',
    'Service Time (Mins)',
    'Cancellation Reason',
  ];

  const rows: string[] = [headers.join(',')];

  for (const e of entries) {
    let waitMinutes = '';
    if (e.calledAt) {
      waitMinutes = ((e.calledAt.getTime() - e.joinedAt.getTime()) / 60000).toFixed(1);
    }

    let serviceMinutes = '';
    if (e.status === EntryStatus.COMPLETED && e.completedAt) {
      const start = e.servingAt || e.calledAt;
      if (start) {
        serviceMinutes = ((e.completedAt.getTime() - start.getTime()) / 60000).toFixed(1);
      }
    }

    rows.push([
      escapeCsv(e.ticketNumber || `#${e.position}`),
      escapeCsv(e.queue.branch.name),
      escapeCsv(e.queue.service.name),
      escapeCsv(e.user?.fullName || 'Walk-In Customer'),
      escapeCsv(e.priority),
      escapeCsv(e.source),
      escapeCsv(e.counterNumber || 'N/A'),
      escapeCsv(e.status),
      escapeCsv(e.joinedAt.toISOString()),
      escapeCsv(e.calledAt ? e.calledAt.toISOString() : ''),
      escapeCsv(e.servingAt ? e.servingAt.toISOString() : ''),
      escapeCsv(e.completedAt ? e.completedAt.toISOString() : ''),
      escapeCsv(waitMinutes),
      escapeCsv(serviceMinutes),
      escapeCsv(e.cancellationReason || ''),
    ].join(','));
  }

  return rows.join('\r\n');
};

/**
 * 15. Super Admin Executive Console Analytics
 * High-level platform-wide KPIs, usage trends, top organizations, and completion metrics.
 */
export const getExecutiveConsoleAnalytics = async (period: string = 'last_7_days') => {
  const now = new Date();
  const { startDate, endDate } = resolveDateRange(period, undefined, undefined, 'UTC');

  // 1. Platform-wide KPI Counts (Real Database Aggregation)
  const [
    totalOrganizations,
    pendingOrganizations,
    totalBranches,
    totalStaff,
    totalCustomers,
    totalQueues,
    totalQueueEntries,
    queuesServed,
    queuesNotServed,
    queuesCancelled,
    customersCurrentlyWaiting,
    customersCurrentlyServing,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    pendingAppointments,
  ] = await Promise.all([
    prisma.organization.count(),
    (prisma.organization as any).count({ where: { status: 'PENDING_APPROVAL' } }).catch(() => 0),
    prisma.branch.count(),
    prisma.user.count({ where: { role: { in: [Role.STAFF, Role.BRANCH_MANAGER, Role.ORG_ADMIN] } } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.queue.count(),
    prisma.queueEntry.count(),
    prisma.queueEntry.count({ where: { status: EntryStatus.COMPLETED } }),
    prisma.queueEntry.count({ where: { status: { in: [EntryStatus.SKIPPED, EntryStatus.ABSENT] } } }),
    prisma.queueEntry.count({ where: { status: EntryStatus.CANCELLED } }),
    prisma.queueEntry.count({ where: { status: EntryStatus.WAITING } }),
    prisma.queueEntry.count({ where: { status: EntryStatus.SERVING } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
    prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
  ]);

  const activeOrganizations = Math.max(0, totalOrganizations - pendingOrganizations);

  // 2. Trend Time Buckets
  const isHourly = period === 'today' || period === 'yesterday';
  const buckets: Array<{
    key: string;
    label: string;
    start: Date;
    end: Date;
    queuesCreated: number;
    customersServed: number;
    appointments: number;
    activeOrgs: Set<string>;
  }> = [];

  if (isHourly) {
    const baseDay = new Date(startDate);
    baseDay.setHours(0, 0, 0, 0);
    for (let h = 0; h < 24; h++) {
      const bStart = new Date(baseDay);
      bStart.setHours(h, 0, 0, 0);
      const bEnd = new Date(baseDay);
      bEnd.setHours(h, 59, 59, 999);
      const label = `${String(h).padStart(2, '0')}:00`;
      buckets.push({
        key: label,
        label,
        start: bStart,
        end: bEnd,
        queuesCreated: 0,
        customersServed: 0,
        appointments: 0,
        activeOrgs: new Set<string>(),
      });
    }
  } else {
    const daysCount = period === 'last_90_days' ? 90 : period === 'last_30_days' ? 30 : 7;
    for (let d = daysCount - 1; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);
      const bStart = new Date(day);
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(day);
      bEnd.setHours(23, 59, 59, 999);
      const label = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      buckets.push({
        key: bStart.toISOString().slice(0, 10),
        label,
        start: bStart,
        end: bEnd,
        queuesCreated: 0,
        customersServed: 0,
        appointments: 0,
        activeOrgs: new Set<string>(),
      });
    }
  }

  // 3. Fetch entries and appointments in date range
  const [rangeEntries, rangeAppointments] = await Promise.all([
    prisma.queueEntry.findMany({
      where: { joinedAt: { gte: startDate, lte: endDate } },
      select: {
        joinedAt: true,
        status: true,
        completedAt: true,
        queue: {
          select: {
            branch: { select: { id: true, name: true, organizationId: true } },
          },
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        status: true,
        branch: { select: { organizationId: true } },
      },
    }),
  ]);

  for (const entry of rangeEntries) {
    const time = entry.joinedAt.getTime();
    const orgId = entry.queue?.branch?.organizationId;
    for (const b of buckets) {
      if (time >= b.start.getTime() && time <= b.end.getTime()) {
        b.queuesCreated++;
        if (entry.status === EntryStatus.COMPLETED) {
          b.customersServed++;
        }
        if (orgId) {
          b.activeOrgs.add(orgId);
        }
        break;
      }
    }
  }

  for (const apt of rangeAppointments) {
    const time = apt.createdAt.getTime();
    const orgId = apt.branch?.organizationId;
    for (const b of buckets) {
      if (time >= b.start.getTime() && time <= b.end.getTime()) {
        b.appointments++;
        if (orgId) {
          b.activeOrgs.add(orgId);
        }
        break;
      }
    }
  }

  const usageTrends = buckets.map((b) => ({
    label: b.label,
    key: b.key,
    queuesCreated: b.queuesCreated,
    customersServed: b.customersServed,
    appointments: b.appointments,
    activeOrganizations: b.activeOrgs.size,
  }));

  // 4. Top Organizations by Activity
  const orgs: any[] = await (prisma.organization as any).findMany({
    select: {
      id: true,
      name: true,
      type: true,
      createdAt: true,
      branches: {
        select: {
          id: true,
          name: true,
          queues: {
            select: {
              entries: {
                select: { id: true, status: true },
              },
            },
          },
          appointments: {
            select: { id: true, status: true },
          },
          staff: { select: { id: true } },
        },
      },
    },
  });

  const orgSummaries = orgs.map((org: any) => {
    let ticketCount = 0;
    let completedCount = 0;
    let appointmentCount = 0;
    let totalStaffInOrg = 0;

    for (const b of (org.branches || [])) {
      totalStaffInOrg += (b.staff || []).length;
      appointmentCount += (b.appointments || []).length;
      for (const q of (b.queues || [])) {
        ticketCount += (q.entries || []).length;
        completedCount += (q.entries || []).filter((e: any) => e.status === EntryStatus.COMPLETED).length;
      }
    }

    const completionRate = ticketCount > 0 ? Math.round((completedCount / ticketCount) * 100) : 0;

    return {
      id: org.id,
      name: org.name,
      type: org.type,
      status: org.status || 'ACTIVE',
      branchesCount: (org.branches || []).length,
      staffCount: totalStaffInOrg,
      ticketCount,
      completedCount,
      appointmentCount,
      completionRate,
      createdAt: org.createdAt,
    };
  });

  orgSummaries.sort((a, b) => b.ticketCount + b.appointmentCount - (a.ticketCount + a.appointmentCount));
  const topOrganizations = orgSummaries.slice(0, 5);

  // 5. Most Active Branches
  const allBranches: any[] = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      organization: { select: { name: true } },
      queues: {
        select: {
          entries: {
            select: { status: true },
          },
        },
      },
    },
  });

  const branchRankings = allBranches.map((br: any) => {
    let tickets = 0;
    let completed = 0;
    let waiting = 0;
    for (const q of (br.queues || [])) {
      tickets += (q.entries || []).length;
      completed += (q.entries || []).filter((e: any) => e.status === EntryStatus.COMPLETED).length;
      waiting += (q.entries || []).filter((e: any) => e.status === EntryStatus.WAITING).length;
    }
    return {
      branchId: br.id,
      branchName: br.name,
      organizationName: br.organization?.name || 'Organization',
      tickets,
      completed,
      waiting,
      completionRate: tickets > 0 ? Math.round((completed / tickets) * 100) : 0,
    };
  });

  branchRankings.sort((a, b) => b.tickets - a.tickets);
  const topBranches = branchRankings.slice(0, 5);

  // 6. Completion Rates
  const queueCompletionRate =
    totalQueueEntries > 0 ? Math.round((queuesServed / totalQueueEntries) * 1000) / 10 : 0;
  const queueCancellationRate =
    totalQueueEntries > 0 ? Math.round((queuesCancelled / totalQueueEntries) * 1000) / 10 : 0;
  const appointmentCompletionRate =
    totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 1000) / 10 : 0;

  // 7. Peak Usage Hours across Platform
  const peakHoursMap = new Array(24).fill(0);
  for (const entry of rangeEntries) {
    const hour = entry.joinedAt.getHours();
    peakHoursMap[hour]++;
  }
  const peakHours = peakHoursMap.map((count, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    count,
  }));

  // 8. Recent Platform Audit Events
  const recentAudits = await prisma.auditLog.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true, role: true } },
      organization: { select: { name: true } },
    },
  }).catch(() => []);

  return {
    period,
    kpis: {
      totalOrganizations,
      activeOrganizations,
      pendingOrganizations,
      totalBranches,
      totalStaff,
      totalCustomers,
      totalQueues,
      totalQueueEntries,
      queuesServed,
      queuesNotServed,
      queuesCancelled,
      customersCurrentlyWaiting,
      customersCurrentlyServing,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingAppointments,
    },
    usageTrends,
    topOrganizations,
    topBranches,
    completionRates: {
      queueCompletionRate,
      queueCancellationRate,
      appointmentCompletionRate,
    },
    peakHours,
    recentAudits,
  };
};

/**
 * 16. Super Admin Queue Oversight (Read-Only Platform View)
 */
export const getQueueOversight = async (filter: {
  organizationId?: string;
  branchId?: string;
  serviceId?: string;
  status?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { startDate, endDate } = resolveDateRange(filter.dateRange || 'today', filter.startDate, filter.endDate, 'UTC');

  const entryWhere: any = {
    joinedAt: { gte: startDate, lte: endDate },
  };

  const queueWhere: any = {};

  if (filter.serviceId) {
    entryWhere.queue = { serviceId: filter.serviceId };
    queueWhere.serviceId = filter.serviceId;
  } else if (filter.branchId) {
    entryWhere.queue = { branchId: filter.branchId };
    queueWhere.branchId = filter.branchId;
  } else if (filter.organizationId) {
    entryWhere.queue = { branch: { organizationId: filter.organizationId } };
    queueWhere.branch = { organizationId: filter.organizationId };
  }

  if (filter.status && filter.status !== 'ALL') {
    entryWhere.status = filter.status as EntryStatus;
  }

  // Summary Metrics
  const [
    currentlyWaiting,
    currentlyServing,
    totalJoined,
    served,
    notServed,
    cancelled,
  ] = await Promise.all([
    prisma.queueEntry.count({
      where: {
        status: EntryStatus.WAITING,
        ...(filter.serviceId
          ? { queue: { serviceId: filter.serviceId } }
          : filter.branchId
          ? { queue: { branchId: filter.branchId } }
          : filter.organizationId
          ? { queue: { branch: { organizationId: filter.organizationId } } }
          : {}),
      },
    }),
    prisma.queueEntry.count({
      where: {
        status: EntryStatus.SERVING,
        ...(filter.serviceId
          ? { queue: { serviceId: filter.serviceId } }
          : filter.branchId
          ? { queue: { branchId: filter.branchId } }
          : filter.organizationId
          ? { queue: { branch: { organizationId: filter.organizationId } } }
          : {}),
      },
    }),
    prisma.queueEntry.count({ where: entryWhere }),
    prisma.queueEntry.count({ where: { ...entryWhere, status: EntryStatus.COMPLETED } }),
    prisma.queueEntry.count({
      where: { ...entryWhere, status: { in: [EntryStatus.SKIPPED, EntryStatus.ABSENT] } },
    }),
    prisma.queueEntry.count({ where: { ...entryWhere, status: EntryStatus.CANCELLED } }),
  ]);

  const completionRate = totalJoined > 0 ? Math.round((served / totalJoined) * 1000) / 10 : 0;
  const cancellationRate = totalJoined > 0 ? Math.round((cancelled / totalJoined) * 1000) / 10 : 0;

  // Queues List
  const queues = await prisma.queue.findMany({
    where: queueWhere,
    include: {
      service: { select: { id: true, name: true, duration: true } },
      branch: {
        select: {
          id: true,
          name: true,
          location: true,
          organization: { select: { id: true, name: true } },
        },
      },
      entries: {
        where: { status: { in: [EntryStatus.WAITING, EntryStatus.CALLING, EntryStatus.SERVING] } },
        select: { id: true, status: true },
      },
    },
  });

  const queuesOverview = queues.map((q) => {
    const waiting = q.entries.filter((e) => e.status === EntryStatus.WAITING).length;
    const serving = q.entries.filter((e) => e.status === EntryStatus.SERVING || e.status === EntryStatus.CALLING).length;
    return {
      id: q.id,
      serviceName: q.service?.name || 'General Queue',
      serviceId: q.serviceId,
      branchName: q.branch?.name || 'Branch',
      branchId: q.branch?.id || q.branchId,
      organizationName: q.branch?.organization?.name || 'Organization',
      organizationId: q.branch?.organization?.id || '',
      status: q.status,
      capacity: q.capacity || 50,
      waitingCount: waiting,
      servingCount: serving,
    };
  });

  // Recent Queue Entries
  const recentEntries = await prisma.queueEntry.findMany({
    where: entryWhere,
    take: 50,
    orderBy: { joinedAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
      queue: {
        select: {
          service: { select: { name: true } },
          branch: {
            select: {
              name: true,
              organization: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return {
    summary: {
      currentlyWaiting,
      currentlyServing,
      joinedQueue: totalJoined,
      served,
      notServed,
      leftOrCancelled: cancelled,
      completionRate,
      cancellationRate,
    },
    queues: queuesOverview,
    recentEntries: recentEntries.map((e) => ({
      id: e.id,
      ticketNumber: e.ticketNumber || `#${e.position}`,
      customerName: e.user?.fullName || 'Walk-In Customer',
      customerPhone: e.user?.phoneNumber ? `${e.user.phoneNumber.slice(0, 6)}****` : 'N/A',
      serviceName: e.queue?.service?.name || 'Service',
      branchName: e.queue?.branch?.name || 'Branch',
      organizationName: e.queue?.branch?.organization?.name || 'Organization',
      status: e.status,
      priority: e.priority,
      joinedAt: e.joinedAt,
      calledAt: e.calledAt,
      completedAt: e.completedAt,
    })),
  };
};
