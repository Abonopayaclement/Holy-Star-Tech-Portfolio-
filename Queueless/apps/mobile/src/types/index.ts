export type Role = 'CUSTOMER' | 'STAFF' | 'BRANCH_MANAGER' | 'ORG_ADMIN' | 'SUPER_ADMIN';

export type EntryStatus = 
  | 'WAITING'
  | 'CALLING'
  | 'SERVING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'ABSENT';

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'APPOINTMENT';

export type NotificationPreference =
  | 'STANDARD'
  | 'NOTIFY_APPROACHING_5'
  | 'NOTIFY_APPROACHING_2'
  | 'NOTIFY_CALLED_ONLY';

export type AppointmentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'CONFIRMED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'IMPORTANT' | 'URGENT';

export type CallbackChannel =
  | 'IN_APP_NOTIFICATION'
  | 'PUSH_NOTIFICATION'
  | 'SMS'
  | 'WHATSAPP'
  | 'PHONE_CALL';

export type CallbackStatus =
  | 'ACTIVE'
  | 'TRIGGERED'
  | 'ACKNOWLEDGED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CallbackThreshold = 'APPROACHING_5' | 'APPROACHING_2' | 'CALLED';

export type ConversationStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

export type SenderType = 'CUSTOMER' | 'STAFF' | 'SYSTEM';

export interface CallbackRequest {
  id: string;
  organizationId: string;
  branchId: string;
  userId: string;
  queueEntryId: string;
  threshold: CallbackThreshold;
  channel: CallbackChannel;
  status: CallbackStatus;
  triggeredAt?: string | null;
  acknowledgedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string;
  staffId?: string | null;
  queueEntryId?: string | null;
  appointmentId?: string | null;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  message: string;
  metadata?: any;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    role: Role;
  } | null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string | null;
  profilePhoto?: string | null;
  dob?: string | Date | null;
  gender?: string | null;
  address?: string | null;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number; // in minutes
  price?: number;
  isRemote?: boolean;
  allowRemoteJoin?: boolean;
  queues?: { id: string; status: string; closedReason?: string | null }[];
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  location: string;
  operatingHours?: string | null;
  qrCodeId: string;
  isActive?: boolean;
  services?: Service[];
  organization?: {
    id: string;
    name: string;
    type: string;
    logo?: string | null;
  };
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  logo?: string | null;
  branches?: Branch[];
}

export interface QueueEntry {
  id: string;
  queueId: string;
  userId: string;
  ticketNumber: string;
  position: number;
  priority?: PriorityLevel;
  notificationPreference?: NotificationPreference;
  status: EntryStatus;
  joinedAt: string;
  calledAt?: string | null;
  servingAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  isCustomerHidden?: boolean;
  customerHiddenAt?: string | null;
  transferredFromEntryId?: string | null;
  originalServiceId?: string | null;
  originalServiceName?: string | null;
  transferredAt?: string | null;
  transferredByStaffId?: string | null;
  transferReason?: string | null;
  queue?: {
    id: string;
    service?: { name: string; duration: number };
    branch?: { name: string; location: string; organization?: { name: string } };
  };
}

export interface CustomerTicketStatus {
  entry: QueueEntry;
  ticketNumber: string;
  serviceName: string;
  branchName: string;
  branchLocation?: string;
  status: EntryStatus;
  position: number; // current queue position
  ticketSequencePosition?: number;
  peopleAhead: number;
  customersAhead: number;
  priority?: PriorityLevel;
  notificationPreference?: NotificationPreference;
  transferredFromEntryId?: string | null;
  originalServiceName?: string | null;
  transferReason?: string | null;
  transferredAt?: string | null;
  nowServing?: {
    ticketNumber?: string;
    status: EntryStatus;
    position: number;
  } | null;
  estimatedWaitTimeMinutes: number;
  dynamicPaceMinutes?: number;
  baselineDurationMinutes?: number;
  recentAverageMinutes?: number | null;
  completedSampleCount?: number;
  isDynamic?: boolean;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  queueStatus?: string;
  queueClosedReason?: string | null;
  activeTickets?: CustomerTicketStatus[];
}

export interface Appointment {
  id: string;
  userId: string;
  branchId: string;
  serviceId: string;
  categoryId?: string | null;
  scheduledTime?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  problemType?: string | null;
  fee?: number | null;
  feeCurrency?: string;
  rejectionReason?: string | null;
  rejectionNote?: string | null;
  isProblemSolved?: boolean | null;
  feedbackNotes?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  paidAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  originalAppointmentId?: string | null;
  originalAppointment?: Appointment | null;
  followUps?: Appointment[];
  followUpStatus?: string | null;
  followUpNote?: string | null;
  staffInstruction?: string | null;
  isFollowUpCovered?: boolean;
  isCustomerHidden?: boolean;
  customerHiddenAt?: string | null;
  branch?: {
    id: string;
    name: string;
    location: string;
    organization?: { name: string };
  };
  service?: {
    id: string;
    name: string;
    duration: number;
  };
  category?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export interface AppointmentCategory {
  id: string;
  organizationId: string;
  branchId?: string | null;
  serviceId?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QRResolutionResult {
  type: 'BRANCH' | 'SERVICE';
  qrCode?: {
    id: string;
    token: string;
    type: string;
    status: string;
    expiresAt?: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    type: string;
    logo?: string | null;
  };
  branch: {
    id: string;
    name: string;
    location: string;
    operatingHours?: string | null;
    qrCodeId?: string;
    services?: Service[];
  };
  service?: {
    id: string;
    name: string;
    description?: string | null;
    duration: number;
    price: number | string;
    queueId: string | null;
    isQueueOpen: boolean;
  };
}
