export enum Role {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  ORG_ADMIN = 'ORG_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum OrganizationStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  logo?: string | null;
  status: OrganizationStatus | string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  branches?: any[];
  users?: any[];
  _count?: {
    branches?: number;
    users?: number;
  };
}

export enum QueueStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum EntryStatus {
  WAITING = 'WAITING',
  CALLING = 'CALLING',
  SERVING = 'SERVING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  ABSENT = 'ABSENT',
}

export interface User {
  id: string;
  firebaseUid?: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId?: string | null;
  staffBranchId?: string | null;
  phoneNumber?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  pushToken?: string | null;
}

export interface ServiceRating {
  id: string;
  queueEntryId: string;
  userId: string;
  branchId?: string | null;
  serviceId?: string | null;
  rating: number; // 1 to 5
  feedback?: string | null;
  tags?: string | null;
  createdAt: Date | string;
}

export enum PriorityLevel {
  NORMAL = 'NORMAL',
  PRIORITY = 'PRIORITY',
  APPOINTMENT = 'APPOINTMENT',
}

export enum NotificationPreference {
  STANDARD = 'STANDARD',
  NOTIFY_APPROACHING_5 = 'NOTIFY_APPROACHING_5',
  NOTIFY_APPROACHING_2 = 'NOTIFY_APPROACHING_2',
  NOTIFY_CALLED_ONLY = 'NOTIFY_CALLED_ONLY',
}

export interface Skill {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StaffSkill {
  id: string;
  userId: string;
  skillId: string;
  skill?: Skill;
  assignedAt: Date | string;
  assignedBy?: string | null;
}

export interface ServiceSkillRequirement {
  id: string;
  serviceId: string;
  skillId: string;
  skill?: Skill;
  isRequired: boolean;
  createdAt: Date | string;
}

export interface QueueEntry {
  id: string;
  queueId: string;
  userId: string;
  ticketNumber?: string;
  counterNumber?: string | null;
  servedByStaffId?: string | null;
  position: number;
  priority?: PriorityLevel;
  notificationPreference?: NotificationPreference;
  status: EntryStatus;
  joinedAt: Date;
  calledAt?: Date | null;
  servingAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  transferredFromEntryId?: string | null;
  originalServiceId?: string | null;
  transferredAt?: Date | null;
  transferredByStaffId?: string | null;
  transferReason?: string | null;
  rating?: ServiceRating | null;
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CONFIRMED = 'CONFIRMED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface Appointment {
  id: string;
  userId: string;
  user?: User;
  branchId: string;
  branch?: any;
  serviceId: string;
  service?: any;
  scheduledTime?: Date | string | null;
  status: AppointmentStatus;
  problemType?: string | null;
  fee?: number | string | null;
  feeCurrency?: string;
  rejectionReason?: string | null;
  rejectionNote?: string | null;
  isProblemSolved?: boolean | null;
  feedbackNotes?: string | null;
  notes?: string | null;
  approvedAt?: Date | string | null;
  approvedBy?: string | null;
  paidAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  IMPORTANT = 'IMPORTANT',
  URGENT = 'URGENT',
}

export enum CallbackChannel {
  IN_APP_NOTIFICATION = 'IN_APP_NOTIFICATION',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PHONE_CALL = 'PHONE_CALL',
}

export enum CallbackStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum CallbackThreshold {
  APPROACHING_5 = 'APPROACHING_5',
  APPROACHING_2 = 'APPROACHING_2',
  CALLED = 'CALLED',
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SenderType {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  SYSTEM = 'SYSTEM',
}

export enum DeliveryChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  OPENED = 'OPENED',
}

export interface Notification {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  branchId?: string | null;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  priority?: NotificationPriority | string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: Date | string | null;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CallbackRequest {
  id: string;
  organizationId: string;
  branchId: string;
  userId: string;
  queueEntryId: string;
  threshold: CallbackThreshold;
  channel: CallbackChannel;
  status: CallbackStatus;
  triggeredAt?: Date | string | null;
  acknowledgedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserDevice {
  id: string;
  userId: string;
  token: string;
  platform: string;
  lastUsedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  customer?: User;
  staffId?: string | null;
  staff?: User | null;
  queueEntryId?: string | null;
  queueEntry?: QueueEntry | null;
  appointmentId?: string | null;
  status: ConversationStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  senderType: SenderType;
  message: string;
  isRead: boolean;
  readAt?: Date | string | null;
  metadata?: any;
  createdAt: Date | string;
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  attemptCount: number;
  lastError?: string | null;
  sentAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  failedAt?: Date | string | null;
  openedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Service {
  id: string;
  branchId: string;
  name: string;
  description?: string | null;
  duration: number;
  price?: number | string;
  isActive: boolean;
  allowRemoteJoin: boolean;
  allowQrJoin: boolean;
  allowWalkIn: boolean;
  allowAppointments: boolean;
  priorityEnabled: boolean;
  servingCapacity: number;
  capacity?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Queue {
  id: string;
  branchId: string;
  serviceId: string;
  service?: Service;
  status: QueueStatus;
  closedReason?: string | null;
  closedAt?: Date | string | null;
  closedBy?: string | null;
  capacity?: number | null;
  servingCapacity: number;
  priorityRatio: number;
  consecutivePriorityCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==========================================
// PHASE 4 — ADVANCED ANALYTICS & BI TYPES
// ==========================================

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
  p50: number; // Median
  p75: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
  avg: number;
  total?: number; // Total cumulative time across all sampled entries
  sampleSize: number;
  isLowSample: boolean;
}

export interface QueueAnalyticsOverview {
  totalTickets: number;
  waitingTickets: number;
  servingTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  skippedTickets: number;
  absentTickets: number;
  transferredTickets: number;
  completionRate: number; // percentage 0-100
  cancellationRate: number; // percentage 0-100
  abandonmentRate: number; // percentage 0-100
  waitTimeMinutes: PercentileMetrics;
  serviceTimeMinutes: PercentileMetrics;
  totalJourneyTimeMinutes: PercentileMetrics;
}

export interface HourlyDemandMetric {
  hour: number; // 0 - 23
  hourLabel: string; // e.g. "09:00 - 10:00"
  ticketCount: number;
  completedCount: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
}

export interface DayOfWeekMetric {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ... 6 = Saturday
  dayName: string; // "Monday", etc.
  ticketCount: number;
  completedCount: number;
  avgWaitMinutes: number;
  completionRate: number;
  cancellationRate: number;
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
  transferRate: number; // percentage of total tickets
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
  capacityUtilization: number; // percentage
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
  ticketsServed: number;
  ticketsCompleted: number;
  isActive: boolean;
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


