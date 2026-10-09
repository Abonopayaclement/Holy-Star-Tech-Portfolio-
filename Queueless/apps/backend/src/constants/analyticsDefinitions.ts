/**
 * QueueLess Phase 4: Advanced Analytics & Operational Intelligence
 * Authoritative Definitions, Metric Formulas, and Congestion Thresholds
 */

export const ANALYTICS_DEFINITIONS = {
  // Wait Time Definition
  WAIT_TIME: {
    description: 'Time elapsed between customer joining the queue and customer being called to the counter',
    formula: 'calledAt - joinedAt (or createdAt)',
    units: 'minutes',
    transferPolicy: 
      'For transferred tickets, wait time is segmented: Stage 1 wait is (calledAt1 - joinedAt). Stage 2 wait is (calledAt2 - transferredAt). Cumulative wait is the sum of both stages.',
    eligibleStatuses: ['CALLING', 'SERVING', 'COMPLETED'],
  },

  // Service Time Definition
  SERVICE_TIME: {
    description: 'Actual observed elapsed time between staff starting service and completing service',
    formula: 'completedAt - servingAt (fallback to completedAt - calledAt if servingAt is null)',
    units: 'minutes',
    etaPolicy: 'Never substitute estimated ETA for actual observed service time.',
    eligibleStatuses: ['COMPLETED'],
  },

  // Total Customer Journey Time
  TOTAL_JOURNEY_TIME: {
    description: 'Total elapsed time from customer arrival/join until service completion',
    formula: 'completedAt - joinedAt',
    units: 'minutes',
    transferPolicy: 'Encompasses entire multi-service lifecycle from original joinedAt to final completedAt.',
    eligibleStatuses: ['COMPLETED'],
  },

  // Rates
  RATES: {
    COMPLETION_RATE: 'completedCount / (completedCount + cancelledCount + skippedCount + absentCount) * 100',
    CANCELLATION_RATE: 'cancelledCount / totalClosedTickets * 100',
    ABANDONMENT_RATE: '(customerCancelledCount + absentCount) / totalTickets * 100',
    CALLBACK_ACK_RATE: 'acknowledgedCallbacks / triggeredCallbacks * 100',
    NOTIFICATION_DELIVERY_RATE: 'deliveredDeliveries / sentDeliveries * 100',
    NOTIFICATION_OPEN_RATE: 'openedDeliveries / deliveredDeliveries * 100',
  },

  // Sample Size Safety Thresholds
  SAMPLE_SIZE: {
    MINIMUM_SIGNIFICANT_SAMPLE: 5,
    LOW_SAMPLE_WARNING_MESSAGE: 'Sample size is too small for statistical significance. Interpret with caution.',
  },

  // Queue Congestion Thresholds
  CONGESTION: {
    NORMAL: {
      maxWaitingCount: 5,
      maxAvgWaitMinutes: 15,
      maxCapacityUtilizationPercent: 70,
      description: 'Queue operating within normal capacity and acceptable wait bounds.',
    },
    BUSY: {
      minWaitingCount: 6,
      maxWaitingCount: 15,
      minAvgWaitMinutes: 16,
      maxAvgWaitMinutes: 30,
      minCapacityUtilizationPercent: 70,
      maxCapacityUtilizationPercent: 90,
      description: 'Elevated queue length or wait times. Counter staffing adequate but nearing capacity.',
    },
    HIGH_LOAD: {
      minWaitingCount: 16,
      minAvgWaitMinutes: 31,
      minCapacityUtilizationPercent: 90,
      description: 'Queue congestion is critical. Arrival rate substantially exceeds counter serving rate.',
    },
  },
} as const;
