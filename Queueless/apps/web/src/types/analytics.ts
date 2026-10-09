export type AnalyticsDateRange =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface AnalyticsFilterParams {
  organizationId?: string;
  branchId?: string;
  serviceId?: string;
  dateRange?: AnalyticsDateRange;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  channel?: string;
  priority?: string;
  status?: string;
}

export interface PercentileMetrics {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
  avg: number;
  total?: number;
  sampleSize: number;
  isLowSample: boolean;
}

export interface QueueAnalyticsOverview {
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  waitingTickets: number;
  servingTickets: number;
  completionRate: number;
  cancellationRate: number;
  waitTimeMinutes: PercentileMetrics;
  serviceTimeMinutes: PercentileMetrics;
  journeyTimeMinutes: PercentileMetrics;
  timeRange: {
    startDate: string;
    endDate: string;
    rangeKey: string;
  };
}

export interface HourlyDemandMetric {
  hour: number;
  hourLabel: string;
  ticketCount: number;
  completedCount: number;
  cancelledCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
}

export interface DayOfWeekMetric {
  dayOfWeek: number;
  dayName: string;
  ticketCount: number;
  completedCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  completionRate: number;
}

export interface ServicePerformanceMetric {
  serviceId: string;
  serviceName: string;
  branchId: string;
  branchName: string;
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  avgWaitMinutes: number;
  medianWaitMinutes: number;
  p90WaitMinutes: number;
  avgServiceMinutes: number;
  completionRate: number;
  sampleSize: number;
}

export interface BranchPerformanceMetric {
  branchId: string;
  branchName: string;
  location: string;
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  avgWaitMinutes: number;
  medianWaitMinutes: number;
  avgServiceMinutes: number;
  queueUtilization: number;
  appointmentVolume: number;
  remoteJoinVolume: number;
  qrVolume: number;
  walkInVolume: number;
  kioskVolume: number;
  completionRate: number;
  sampleSize: number;
}

export interface OrganizationPerformanceMetric {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  totalBranches: number;
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  avgWaitMinutes: number;
  medianWaitMinutes: number;
  avgServiceMinutes: number;
  appointmentVolume: number;
  remoteJoinVolume: number;
  qrVolume: number;
  walkInVolume: number;
  kioskVolume: number;
  completionRate: number;
  sampleSize: number;
}

export interface SystemQueueMetric {
  queueId: string;
  queueName: string;
  serviceId: string;
  serviceName: string;
  branchId: string;
  branchName: string;
  organizationId: string;
  organizationName: string;
  status: string; // 'OPEN' | 'CLOSED' | 'PAUSED'
  capacity: number;
  waitingCount: number;
  servingCount: number;
  utilizationPercent: number;
  avgWaitMinutes: number;
}

export interface PlatformUserMetric {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organizationId?: string;
  organizationName?: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  ticketsServed?: number;
  ticketsCompleted?: number;
  isActive: boolean;
}

export interface ChannelMetric {
  channel: string;
  label: string;
  volume: number;
  completedCount: number;
  cancelledCount: number;
  completionRate: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  percentage: number;
}

export interface PriorityMetric {
  priority: string;
  label: string;
  volume: number;
  completedCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  percentage: number;
}

export interface TransferFlowPattern {
  sourceServiceId: string;
  sourceServiceName: string;
  destServiceId: string;
  destServiceName: string;
  transferCount: number;
}

export interface TransferMetric {
  totalTransfers: number;
  transferRate: number;
  avgTimeBeforeTransferMinutes: number;
  avgTimeAfterTransferMinutes: number;
  completedAfterTransferCount: number;
  flowPatterns: TransferFlowPattern[];
}

export type QueueCongestionStatus = 'NORMAL' | 'BUSY' | 'HIGH_LOAD';

export interface QueueCongestionMetric {
  status: QueueCongestionStatus;
  waitingCount: number;
  avgCurrentWaitMinutes: number;
  servingCapacity: number;
  capacityUtilization: number;
  arrivalRatePerHour: number;
  completionRatePerHour: number;
  activeCounters: number;
  thresholdExplanation: string;
}

export interface RealTimeOperationsSnapshot {
  branchId?: string;
  branchName?: string;
  organizationId?: string;
  currentlyWaiting: number;
  currentlyServing: number;
  averageCurrentWaitMinutes: number;
  longestCurrentWaitMinutes: number;
  activeCounters: number;
  totalCounters: number;
  openQueues: number;
  totalQueues: number;
  queueCapacityUtilization: number;
  congestionStatus: QueueCongestionStatus;
  lastUpdated: string;
}

export interface StaffPerformanceMetric {
  staffId: string;
  staffName: string;
  email?: string;
  role?: string;
  branchId: string;
  branchName?: string;
  organizationName?: string;
  ticketsServed: number;
  ticketsCompleted: number;
  avgServiceDurationMinutes: number;
  activeServingMinutes: number;
  sampleSize: number;
}

export interface CounterAnalyticsMetric {
  counterId: string;
  counterNumber: string;
  branchId: string;
  status: string;
  ticketsServed: number;
  avgServiceMinutes: number;
  sampleSize: number;
}

export interface AppointmentAnalyticsMetric {
  totalAppointments: number;
  pending: number;
  approved: number;
  confirmed: number;
  rejected: number;
  completed: number;
  cancelled: number;
  paid: number;
  unpaid: number;
  approvalRate: number;
  completionRate: number;
  rejectionRate: number;
  avgTimeToApprovalMinutes: number;
  avgTimeToStartMinutes: number;
  avgResolutionDurationMinutes: number;
  rejectionReasons: Array<{ reason: string; count: number }>;
  followUps: {
    requested: number;
    inReview: number;
    directedToBranch: number;
    resolved: number;
    resolutionRate: number;
  };
  sampleSize: number;
}

export interface CommunicationAnalyticsMetric {
  notifications: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    failed: number;
    deliveryRate: number;
    openRate: number;
    byChannel: Array<{
      channel: string;
      total: number;
      delivered: number;
      opened: number;
      failed: number;
    }>;
  };
  callbacks: {
    total: number;
    triggered: number;
    acknowledged: number;
    cancelled: number;
    expired: number;
    acknowledgementRate: number;
  };
  messages: {
    conversationsCreated: number;
    messagesSent: number;
    messagesRead: number;
    avgResponseTimeMinutes: number;
  };
}

export interface ComprehensiveAnalyticsDashboardData {
  filters: {
    organizationId?: string;
    branchId?: string;
    serviceId?: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    timezone: string;
  };
  overview: QueueAnalyticsOverview;
  hourlyDemand: HourlyDemandMetric[];
  dayOfWeek: DayOfWeekMetric[];
  services: ServicePerformanceMetric[];
  branches?: BranchPerformanceMetric[];
  organizations?: OrganizationPerformanceMetric[];
  channels: ChannelMetric[];
  priorities?: PriorityMetric[];
  transfers?: TransferMetric;
  congestion: QueueCongestionMetric;
  realtime: RealTimeOperationsSnapshot;
  appointments?: AppointmentAnalyticsMetric;
  communication?: CommunicationAnalyticsMetric;
  staff?: StaffPerformanceMetric[];
  counters?: CounterAnalyticsMetric[];
  systemQueues?: SystemQueueMetric[];
  platformUsers?: PlatformUserMetric[];
}
