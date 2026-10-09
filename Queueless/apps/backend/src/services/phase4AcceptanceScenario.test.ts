import * as analyticsService from './analyticsService';
import * as analyticsController from '../controllers/analyticsController';
import prisma from '../config/prisma';
import {
  Role,
  EntryStatus,
  TicketSource,
  PriorityLevel,
  DeliveryStatus,
  DeliveryChannel,
  CallbackStatus,
} from '@prisma/client';

// Tenant Identifiers
const orgAId = 'org-acc-ghana-bank';
const orgBId = 'org-acc-apex-bank';

const branchA1Id = 'branch-acc-airport';
const branchA2Id = 'branch-acc-cantonments';
const branchB1Id = 'branch-acc-osu';

const serviceA1Id = 'svc-forex-desk';
const serviceA2Id = 'svc-cust-support';
const serviceB1Id = 'svc-corporate-banking';

// User Identities
const superAdminUser = { id: 'usr-super', role: Role.SUPER_ADMIN };
const orgAdminAUser = { id: 'usr-admin-a', role: Role.ORG_ADMIN, organizationId: orgAId };
const orgAdminBUser = { id: 'usr-admin-b', role: Role.ORG_ADMIN, organizationId: orgBId };
const branchManagerA1User = { id: 'usr-mgr-a1', role: Role.BRANCH_MANAGER, organizationId: orgAId };
const staffKwameUser = { id: 'usr-staff-kwame', role: Role.STAFF, organizationId: orgAId, staffBranchId: branchA1Id };
const customerAliceUser = { id: 'usr-cust-alice', role: Role.CUSTOMER };

// In-Memory Database Stores for Acceptance Test
const orgsStore = [
  { id: orgAId, name: 'Ghana Commercial Bank', type: 'BANK' },
  { id: orgBId, name: 'Apex Bank', type: 'BANK' },
];

const branchesStore = [
  { id: branchA1Id, organizationId: orgAId, name: 'Airport Branch', location: 'Terminal 3', isActive: true, managers: [branchManagerA1User] },
  { id: branchA2Id, organizationId: orgAId, name: 'Cantonments Branch', location: 'Embassy Rd', isActive: true, managers: [] },
  { id: branchB1Id, organizationId: orgBId, name: 'Osu Branch', location: 'Oxford St', isActive: true, managers: [] },
];

const servicesStore = [
  { id: serviceA1Id, branchId: branchA1Id, name: 'Forex Desk', duration: 15, isActive: true, branch: branchesStore[0] },
  { id: serviceA2Id, branchId: branchA1Id, name: 'Customer Support', duration: 20, isActive: true, branch: branchesStore[0] },
  { id: serviceB1Id, branchId: branchB1Id, name: 'Corporate Banking', duration: 30, isActive: true, branch: branchesStore[2] },
];

const queueEntriesStore: any[] = [];
const appointmentsStore: any[] = [];
const notificationDeliveriesStore: any[] = [];
const callbackRequestsStore: any[] = [];
const conversationsStore: any[] = [];
const countersStore: any[] = [
  { id: 'counter-1', branchId: branchA1Id, counterNumber: 'Counter 1', status: 'AVAILABLE', isActive: true },
  { id: 'counter-2', branchId: branchA1Id, counterNumber: 'Counter 2', status: 'AVAILABLE', isActive: true },
];

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    branch: {
      findUnique: jest.fn(async ({ where }: any) => {
        return branchesStore.find((b) => b.id === where.id) || null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        if (where?.managers?.some) {
          const mgrId = where.managers.some.id;
          return branchesStore.filter((b) => b.managers.some((m) => m.id === mgrId));
        }
        if (where?.organizationId) {
          return branchesStore.filter((b) => b.organizationId === where.organizationId);
        }
        return branchesStore;
      }),
    },
    service: {
      findMany: jest.fn(async ({ where }: any) => {
        if (where?.branchId) {
          return servicesStore.filter((s) => s.branchId === where.branchId);
        }
        if (where?.branch?.organizationId) {
          return servicesStore.filter((s) => s.branch.organizationId === where.branch.organizationId);
        }
        return servicesStore;
      }),
    },
    queue: {
      findMany: jest.fn(async ({ where }: any) => {
        const queues = [
          {
            id: 'q-forex',
            branchId: branchA1Id,
            serviceId: serviceA1Id,
            status: 'OPEN',
            capacity: 50,
            servingCapacity: 2,
            entries: queueEntriesStore.filter((e) => ['WAITING', 'CALLING', 'SERVING'].includes(e.status)),
          },
        ];
        return queues;
      }),
      count: jest.fn(async () => 1),
    },
    queueEntry: {
      findMany: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.filter((e) => {
          if (where?.queue?.branch?.organizationId && e.queue?.branch?.organizationId !== where.queue.branch.organizationId) {
            return false;
          }
          if (where?.queue?.branchId && e.queue?.branchId !== where.queue.branchId) {
            return false;
          }
          if (where?.queue?.serviceId && e.queue?.serviceId !== where.queue.serviceId) {
            return false;
          }
          if (where?.OR && Array.isArray(where.OR)) {
            const matchesOr = where.OR.some((clause: any) => {
              if (clause.transferredAt && clause.transferredAt.not === null) {
                return e.transferredAt !== null;
              }
              if (clause.transferredFromEntryId && clause.transferredFromEntryId.not === null) {
                return e.transferredFromEntryId !== null;
              }
              return false;
            });
            if (!matchesOr) return false;
          }
          return true;
        });
      }),
      count: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.length;
      }),
    },
    appointment: {
      findMany: jest.fn(async ({ where }: any) => {
        return appointmentsStore.filter((a) => {
          if (where?.branch?.organizationId && a.branch?.organizationId !== where.branch.organizationId) {
            return false;
          }
          if (where?.branchId && a.branchId !== where.branchId) {
            return false;
          }
          return true;
        });
      }),
      count: jest.fn(async () => appointmentsStore.length),
    },
    notificationDelivery: {
      findMany: jest.fn(async ({ where }: any) => {
        return notificationDeliveriesStore;
      }),
    },
    callbackRequest: {
      findMany: jest.fn(async ({ where }: any) => {
        return callbackRequestsStore;
      }),
    },
    conversation: {
      findMany: jest.fn(async ({ where }: any) => {
        return conversationsStore;
      }),
    },
    serviceCounter: {
      findMany: jest.fn(async () => countersStore),
      count: jest.fn(async () => countersStore.length),
    },
    user: {
      findMany: jest.fn(async () => [staffKwameUser]),
    },
  };

  return {
    __esModule: true,
    default: mPrisma,
  };
});

describe('Phase 4 Acceptance Scenario — Operational Intelligence & Tenant Isolation', () => {
  const baseTime = new Date('2026-09-25T08:00:00Z');

  beforeAll(() => {
    // Populate realistic enterprise lifecycle data for Organization A
    const t0 = new Date('2026-09-25T09:00:00Z');
    const t1 = new Date('2026-09-25T09:12:00Z'); // 12m wait
    const t2 = new Date('2026-09-25T09:14:00Z'); // serving start
    const t3 = new Date('2026-09-25T09:28:00Z'); // 14m service -> completed

    // 1. Mobile Remote Ticket (Completed)
    queueEntriesStore.push({
      id: 'entry-alice-remote',
      ticketNumber: 'A-001',
      position: 1,
      priority: PriorityLevel.NORMAL,
      source: TicketSource.REMOTE,
      counterNumber: 'Counter 1',
      servedByStaffId: staffKwameUser.id,
      status: EntryStatus.COMPLETED,
      joinedAt: t0,
      calledAt: t1,
      servingAt: t2,
      completedAt: t3,
      transferredAt: null,
      transferredFromEntryId: null,
      queue: {
        id: 'q-forex',
        serviceId: serviceA1Id,
        branchId: branchA1Id,
        service: { id: serviceA1Id, name: 'Forex Desk' },
        branch: { id: branchA1Id, name: 'Airport Branch', organizationId: orgAId },
      },
      user: { fullName: 'Alice Johnson' },
    });

    // 2. Kiosk Ticket (Completed)
    const kJoin = new Date('2026-09-25T09:05:00Z');
    const kCall = new Date('2026-09-25T09:20:00Z'); // 15m wait
    const kComp = new Date('2026-09-25T09:35:00Z'); // 15m service
    queueEntriesStore.push({
      id: 'entry-bob-kiosk',
      ticketNumber: 'A-002',
      position: 2,
      priority: PriorityLevel.PRIORITY,
      source: TicketSource.KIOSK,
      counterNumber: 'Counter 2',
      servedByStaffId: staffKwameUser.id,
      status: EntryStatus.COMPLETED,
      joinedAt: kJoin,
      calledAt: kCall,
      servingAt: kCall,
      completedAt: kComp,
      transferredAt: null,
      transferredFromEntryId: null,
      queue: {
        id: 'q-forex',
        serviceId: serviceA1Id,
        branchId: branchA1Id,
        service: { id: serviceA1Id, name: 'Forex Desk' },
        branch: { id: branchA1Id, name: 'Airport Branch', organizationId: orgAId },
      },
      user: { fullName: 'Bob Kiosk' },
    });

    // 3. QR Ticket (Cancelled with reason)
    const qrJoin = new Date('2026-09-25T09:10:00Z');
    queueEntriesStore.push({
      id: 'entry-charlie-qr',
      ticketNumber: 'A-003',
      position: 3,
      priority: PriorityLevel.NORMAL,
      source: TicketSource.QR,
      counterNumber: null,
      status: EntryStatus.CANCELLED,
      cancelledBy: 'CUSTOMER',
      cancellationReason: 'Waited too long for appointment',
      joinedAt: qrJoin,
      calledAt: null,
      servingAt: null,
      completedAt: null,
      cancelledAt: new Date('2026-09-25T09:25:00Z'),
      transferredAt: null,
      transferredFromEntryId: null,
      queue: {
        id: 'q-forex',
        serviceId: serviceA1Id,
        branchId: branchA1Id,
        service: { id: serviceA1Id, name: 'Forex Desk' },
        branch: { id: branchA1Id, name: 'Airport Branch', organizationId: orgAId },
      },
      user: { fullName: 'Charlie QR' },
    });

    // 4. Transferred Ticket (Forex Desk -> Customer Support)
    const trJoin = new Date('2026-09-25T09:15:00Z');
    const trCall1 = new Date('2026-09-25T09:25:00Z'); // 10m stage 1 wait
    const trTransfer = new Date('2026-09-25T09:30:00Z');
    const trCall2 = new Date('2026-09-25T09:38:00Z'); // 8m stage 2 wait
    const trComp = new Date('2026-09-25T09:55:00Z');

    queueEntriesStore.push({
      id: 'entry-david-transferred',
      ticketNumber: 'A-004',
      position: 4,
      priority: PriorityLevel.NORMAL,
      source: TicketSource.WALK_IN,
      counterNumber: 'Counter 1',
      servedByStaffId: staffKwameUser.id,
      status: EntryStatus.COMPLETED,
      joinedAt: trJoin,
      calledAt: trCall2,
      servingAt: trCall2,
      completedAt: trComp,
      transferredAt: trTransfer,
      transferredFromEntryId: 'entry-david-orig',
      originalServiceId: serviceA1Id,
      transferredFromEntry: {
        joinedAt: trJoin,
        calledAt: trCall1,
        queue: { serviceId: serviceA1Id, service: { name: 'Forex Desk' } },
      },
      queue: {
        id: 'q-support',
        serviceId: serviceA2Id,
        branchId: branchA1Id,
        service: { id: serviceA2Id, name: 'Customer Support' },
        branch: { id: branchA1Id, name: 'Airport Branch', organizationId: orgAId },
      },
      user: { fullName: 'David Transferred' },
    });

    // 5. Appointments: 1 Approved + 1 Rejected
    appointmentsStore.push({
      id: 'app-1',
      branchId: branchA1Id,
      serviceId: serviceA1Id,
      status: 'COMPLETED',
      fee: 100,
      createdAt: baseTime,
      scheduledTime: new Date('2026-09-25T11:00:00Z'),
      approvedAt: new Date('2026-09-25T08:30:00Z'),
      startedAt: new Date('2026-09-25T11:05:00Z'),
      completedAt: new Date('2026-09-25T11:25:00Z'),
      rejectionReason: null,
      followUpStatus: 'RESOLVED',
      branch: { organizationId: orgAId },
    });

    appointmentsStore.push({
      id: 'app-2',
      branchId: branchA1Id,
      serviceId: serviceA1Id,
      status: 'REJECTED',
      fee: 0,
      createdAt: baseTime,
      scheduledTime: new Date('2026-09-25T12:00:00Z'),
      approvedAt: null,
      startedAt: null,
      completedAt: null,
      rejectionReason: 'Branch at capacity for requested time slot',
      followUpStatus: null,
      branch: { organizationId: orgAId },
    });

    // 6. Communications: Notification Deliveries & Callbacks
    notificationDeliveriesStore.push(
      { channel: DeliveryChannel.IN_APP, status: DeliveryStatus.OPENED },
      { channel: DeliveryChannel.SMS, status: DeliveryStatus.DELIVERED },
      { channel: DeliveryChannel.PUSH, status: DeliveryStatus.FAILED }
    );

    callbackRequestsStore.push(
      { status: CallbackStatus.ACKNOWLEDGED },
      { status: CallbackStatus.CANCELLED }
    );
  });

  describe('Step 1: Core Queue Operational Metrics & Percentiles', () => {
    it('calculates comprehensive dashboard metrics accurately without fake data', async () => {
      const dashboard = await analyticsService.getComprehensiveDashboard({
        organizationId: orgAId,
        branchId: branchA1Id,
        dateRange: 'today',
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.overview.totalTickets).toBe(4);
      expect(dashboard.overview.completedTickets).toBe(3);
      expect(dashboard.overview.cancelledTickets).toBe(1);
      expect(dashboard.overview.transferredTickets).toBe(1);
      expect(dashboard.overview.completionRate).toBe(75); // 3 completed / 4 closed = 75%
      expect(dashboard.overview.cancellationRate).toBe(25); // 1 cancelled / 4 closed = 25%

      // Percentile assertions
      expect(dashboard.overview.waitTimeMinutes.p50).toBeGreaterThan(0);
      expect(dashboard.overview.waitTimeMinutes.p90).toBeGreaterThanOrEqual(dashboard.overview.waitTimeMinutes.p50);
      expect(dashboard.overview.serviceTimeMinutes.sampleSize).toBe(3);
      expect(dashboard.overview.totalJourneyTimeMinutes.sampleSize).toBe(3);
    });

    it('verifies transfer flow patterns and multi-stage wait calculation', async () => {
      const transfers = await analyticsService.getTransferMetrics(
        { organizationId: orgAId, branchId: branchA1Id },
        analyticsService.resolveDateRange('today')
      );

      expect(transfers.totalTransfers).toBe(1);
      expect(transfers.flowPatterns.length).toBe(1);
      expect(transfers.flowPatterns[0].sourceServiceName).toBe('Forex Desk');
      expect(transfers.flowPatterns[0].destServiceName).toBe('Customer Support');
      expect(transfers.flowPatterns[0].transferCount).toBe(1);
      expect(transfers.completedAfterTransferCount).toBe(1);
    });

    it('verifies channel acquisition breakdown', async () => {
      const channels = await analyticsService.getChannelMetrics(
        { organizationId: orgAId, branchId: branchA1Id },
        analyticsService.resolveDateRange('today')
      );

      const remote = channels.find((c) => c.channel === TicketSource.REMOTE);
      const kiosk = channels.find((c) => c.channel === TicketSource.KIOSK);
      const qr = channels.find((c) => c.channel === TicketSource.QR);
      const walkIn = channels.find((c) => c.channel === TicketSource.WALK_IN);

      expect(remote?.volume).toBe(1);
      expect(kiosk?.volume).toBe(1);
      expect(qr?.volume).toBe(1);
      expect(walkIn?.volume).toBe(1);
    });
  });

  describe('Step 2: Appointments, Rejections, and Communication Analytics', () => {
    it('accurately captures appointment rates and factual rejection counts', async () => {
      const appMetrics = await analyticsService.getAppointmentAnalytics(
        { organizationId: orgAId, branchId: branchA1Id },
        analyticsService.resolveDateRange('today')
      );

      expect(appMetrics.totalAppointments).toBe(2);
      expect(appMetrics.approvalRate).toBe(50);
      expect(appMetrics.rejectionRate).toBe(50);
      expect(appMetrics.rejectionReasons).toContainEqual({
        reason: 'Branch at capacity for requested time slot',
        count: 1,
      });
      expect(appMetrics.followUps.resolved).toBe(1);
      expect(appMetrics.followUps.resolutionRate).toBe(100);
    });

    it('accurately measures notification delivery and callback acknowledgement', async () => {
      const commMetrics = await analyticsService.getCommunicationAnalytics(
        { organizationId: orgAId, branchId: branchA1Id },
        analyticsService.resolveDateRange('today')
      );

      expect(commMetrics.notifications.total).toBe(3);
      expect(commMetrics.callbacks.acknowledgementRate).toBe(100); // 1 ack out of 1 triggered
    });
  });

  describe('Step 3: Multi-Tenant Isolation & Role-Based Authorization', () => {
    it('permits Organization Admin A to access Organization A analytics', async () => {
      const auth = await analyticsController.authorizeAnalyticsRequest(orgAdminAUser, {
        organizationId: orgAId,
        branchId: branchA1Id,
      });
      expect(auth.authorized).toBe(true);
      expect(auth.filter?.organizationId).toBe(orgAId);
    });

    it('blocks Organization Admin A from accessing Organization B analytics with 403 Forbidden', async () => {
      const auth = await analyticsController.authorizeAnalyticsRequest(orgAdminAUser, {
        organizationId: orgBId,
      });
      expect(auth.authorized).toBe(false);
      expect(auth.errorStatus).toBe(403);
      expect(auth.errorMessage).toContain('Cannot access another organization\'s analytics');
    });

    it('blocks Branch Manager A1 from accessing Branch A2 analytics with 403 Forbidden', async () => {
      const auth = await analyticsController.authorizeAnalyticsRequest(branchManagerA1User, {
        branchId: branchA2Id,
      });
      expect(auth.authorized).toBe(false);
      expect(auth.errorStatus).toBe(403);
      expect(auth.errorMessage).toContain('not authorized to view analytics for this branch');
    });

    it('blocks Staff Kwame from accessing unauthorized Branch A2 analytics with 403 Forbidden', async () => {
      const auth = await analyticsController.authorizeAnalyticsRequest(staffKwameUser, {
        branchId: branchA2Id,
      });
      expect(auth.authorized).toBe(false);
      expect(auth.errorStatus).toBe(403);
      expect(auth.errorMessage).toContain('Staff can only access operational analytics for their assigned branch');
    });

    it('blocks Customer Alice from accessing enterprise analytics with 403 Forbidden', async () => {
      const auth = await analyticsController.authorizeAnalyticsRequest(customerAliceUser, {
        organizationId: orgAId,
      });
      expect(auth.authorized).toBe(false);
      expect(auth.errorStatus).toBe(403);
      expect(auth.errorMessage).toContain('Customers cannot access enterprise operational analytics');
    });
  });

  describe('Step 4: CSV Export Serializer Verification', () => {
    it('generates compliant RFC 4180 CSV with customer entries and wait times', async () => {
      const csv = await analyticsService.exportAnalyticsToCsv({
        organizationId: orgAId,
        branchId: branchA1Id,
      });

      expect(csv).toContain('Ticket Number,Branch,Service');
      expect(csv).toContain('"A-001"');
      expect(csv).toContain('"Alice Johnson"');
      expect(csv).toContain('"Forex Desk"');
      expect(csv).toContain('"A-002"');
      expect(csv).toContain('"Bob Kiosk"');
      expect(csv).toContain('"A-003"');
      expect(csv).toContain('"Waited too long for appointment"');
    });
  });
});
