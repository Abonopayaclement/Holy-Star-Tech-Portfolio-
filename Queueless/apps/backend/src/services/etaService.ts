import prisma from '../config/prisma';
import { EntryStatus } from '@prisma/client';

export interface DynamicEtaResult {
  estimatedWaitTimeMinutes: number;
  dynamicPaceMinutes: number;
  baselineDurationMinutes: number;
  recentAverageMinutes: number | null;
  completedSampleCount: number;
  isDynamic: boolean;
}

/**
 * Calculate dynamic pace and estimated wait time based on actual completed ticket timestamps.
 *
 * Algorithm:
 * - Uses real completed service times: duration = (completedAt - servingAt) / 60000
 * - Samples up to the last 10 completed tickets within 24 hours (ignoring outliers < 0.5m or > 120m)
 * - Applies Bayesian shrinkage smoothing with K = 2:
 *     dynamicPace = (K * baseline + sum(durations)) / (K + sampleCount)
 * - Accounts for currently serving ticket elapsed time
 * - Stable, sensible, non-erratic adaptation to real staff service speeds
 */
export const calculateQueueEta = async (
  queueId: string,
  peopleAhead: number,
  entryStatus?: EntryStatus | string,
  queueOrService?: { service?: { duration?: number } }
): Promise<DynamicEtaResult> => {
  // If customer is already being called or served, their wait time is 0
  if (entryStatus === EntryStatus.CALLING || entryStatus === EntryStatus.SERVING) {
    return {
      estimatedWaitTimeMinutes: 0,
      dynamicPaceMinutes: queueOrService?.service?.duration || 15,
      baselineDurationMinutes: queueOrService?.service?.duration || 15,
      recentAverageMinutes: null,
      completedSampleCount: 0,
      isDynamic: false,
    };
  }

  // 1. Fetch queue baseline duration and serving capacity if not provided
  let baselineDuration = queueOrService?.service?.duration;
  let servingCapacity = (queueOrService as any)?.servingCapacity || (queueOrService as any)?.service?.servingCapacity;
  if (!baselineDuration || !servingCapacity) {
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { service: { select: { duration: true, servingCapacity: true } } },
    });
    if (!baselineDuration) baselineDuration = queue?.service?.duration || 15;
    if (!servingCapacity) servingCapacity = queue?.servingCapacity || queue?.service?.servingCapacity || 1;
  }

  // 2. Fetch recent completed tickets within last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCompleted = (await prisma.queueEntry.findMany({
    where: {
      queueId,
      status: EntryStatus.COMPLETED,
      completedAt: { gte: twentyFourHoursAgo },
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
    select: {
      servingAt: true,
      calledAt: true,
      completedAt: true,
    },
  })) || [];

  // 3. Compute valid actual durations in minutes
  const validDurations: number[] = [];
  for (const entry of recentCompleted) {
    if (!entry.completedAt) continue;
    const startTime = entry.servingAt || entry.calledAt;
    if (!startTime) continue;
    const diffMs = entry.completedAt.getTime() - startTime.getTime();
    const durationMins = diffMs / (60 * 1000);
    // Sanity boundary: between 30 seconds and 120 minutes
    if (durationMins >= 0.5 && durationMins <= 120) {
      validDurations.push(durationMins);
    }
  }

  // 4. Calculate dynamic pace with Bayesian smoothing
  let dynamicPace = baselineDuration;
  let isDynamic = false;
  let recentAverageMinutes: number | null = null;

  if (validDurations.length > 0) {
    const sumDurations = validDurations.reduce((acc, d) => acc + d, 0);
    recentAverageMinutes = Math.round((sumDurations / validDurations.length) * 10) / 10;

    const K = 2; // Prior strength (prevents wild single-ticket fluctuations)
    dynamicPace = (K * baselineDuration + sumDurations) / (K + validDurations.length);
    dynamicPace = Math.round(dynamicPace * 10) / 10;
    isDynamic = true;
  }

  // 5. Account for currently active customer at counter
  let currentRemain = 0;
  const currentlyServing = await prisma.queueEntry.findFirst({
    where: { queueId, status: EntryStatus.SERVING },
    select: { servingAt: true },
  });

  if (currentlyServing?.servingAt) {
    const elapsedMins = (Date.now() - currentlyServing.servingAt.getTime()) / (60 * 1000);
    currentRemain = Math.max(0, dynamicPace - elapsedMins);
  } else if (!currentlyServing) {
    const currentlyCalling = await prisma.queueEntry.findFirst({
      where: { queueId, status: EntryStatus.CALLING },
      select: { calledAt: true },
    });
    if (currentlyCalling?.calledAt) {
      const elapsedMins = (Date.now() - currentlyCalling.calledAt.getTime()) / (60 * 1000);
      currentRemain = Math.max(0, dynamicPace - elapsedMins);
    }
  }

  // 6. Total ETA calculation distributed over serving counters/capacity
  const activeCounters = Math.max(1, Number(servingCapacity) || 1);
  const totalEtaMinutes = (currentRemain + (peopleAhead * dynamicPace)) / activeCounters;
  const estimatedWaitTimeMinutes = Math.max(
    peopleAhead > 0 ? 1 : 0,
    Math.round(totalEtaMinutes)
  );

  return {
    estimatedWaitTimeMinutes,
    dynamicPaceMinutes: dynamicPace,
    baselineDurationMinutes: baselineDuration,
    recentAverageMinutes,
    completedSampleCount: validDurations.length,
    isDynamic,
  };
};
