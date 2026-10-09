import * as queueService from './queueService';
import * as kioskService from './kioskService';
import * as counterService from './counterService';
import * as lobbyService from './lobbyService';
import * as ticketPrintService from './ticketPrintService';
import prisma from '../config/prisma';
import {
  Role,
  EntryStatus,
  CounterStatus,
  LobbyDisplayMode,
  TicketSource,
  PriorityLevel,
  NotificationPreference,
} from '@prisma/client';

const orgAId = 'org-acc-ghana-bank';
const orgBId = 'org-acc-competitor-bank';
const branchAId = 'branch-acc-airport';
const branchBId = 'branch-acc-cantonments';

const mobileUserId = 'user-mobile-alice';
const qrUserId = 'user-qr-bob';
const staffUserId = 'user-staff-kwame';

const orgA = { id: orgAId, name: 'Ghana Commercial Bank', type: 'BANK' };
const orgB = { id: orgBId, name: 'Apex Bank', type: 'BANK' };

const branchA = {
  id: branchAId,
  name: 'Airport Branch',
  organizationId: orgAId,
  organization: orgA,
  location: 'Terminal 3 Arrival Hall',
  isActive: true,
  operatingHours: '08:00 - 17:00',
};

const branchB = {
  id: branchBId,
  name: 'Cantonments Branch',
  organizationId: orgBId,
  organization: orgB,
  location: 'Embassy Road',
  isActive: true,
};

const customerCareService = {
  id: 'svc-cust-care',
  branchId: branchAId,
  name: 'Customer Care',
  duration: 15,
  isActive: true,
  allowRemoteJoin: true,
  allowQrJoin: true,
  allowWalkIn: true,
  branch: branchA,
  queues: [{ id: 'q-cust-care', branchId: branchAId, status: 'OPEN', priorityRatio: 2, consecutivePriorityCount: 0 }],
};

const customerCareQueue = {
  id: 'q-cust-care',
  branchId: branchAId,
  serviceId: customerCareService.id,
  status: 'OPEN',
  service: customerCareService,
  branch: branchA,
  consecutivePriorityCount: 0,
};

// In-memory data store for acceptance test simulation
const queueEntriesStore: any[] = [];
const countersStore: any[] = [];
const kiosksStore: any[] = [];
const lobbyDisplaysStore: any[] = [];
const notificationsStore: any[] = [];
const auditLogsStore: any[] = [];
let ticketSequenceCounter = 0;

jest.mock('../config/prisma', () => {
  const mockTx: any = {
    organization: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === orgAId) return orgA;
        if (where.id === orgBId) return orgB;
        return null;
      }),
    },
    branch: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === branchAId) return branchA;
        if (where.id === branchBId) return branchB;
        return null;
      }),
      findMany: jest.fn(async () => [branchA, branchB]),
    },
    service: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === customerCareService.id) return customerCareService;
        return null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        if (where?.branchId === branchAId) {
          return [
            {
              ...customerCareService,
              queues: [customerCareQueue],
              counters: countersStore.filter((c) => c.branchId === branchAId && c.isActive),
            },
          ];
        }
        return [];
      }),
    },
    queue: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === customerCareQueue.id) return customerCareQueue;
        return null;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.serviceId === customerCareService.id) return customerCareQueue;
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        Object.assign(customerCareQueue, data);
        return customerCareQueue;
      }),
    },
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === mobileUserId) {
          return { id: mobileUserId, fullName: 'Alice Mobile', role: Role.CUSTOMER, phoneNumber: '+233201111111' };
        }
        if (where.id === qrUserId) {
          return { id: qrUserId, fullName: 'Bob QR', role: Role.CUSTOMER, phoneNumber: '+233202222222' };
        }
        if (where.id === staffUserId) {
          return { id: staffUserId, fullName: 'Kwame Staff', role: Role.STAFF, staffBranchId: branchAId };
        }
        return null;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.phoneNumber === '+233203333333') {
          return { id: 'user-kiosk-charlie', fullName: 'Charlie Kiosk', role: Role.CUSTOMER, phoneNumber: '+233203333333' };
        }
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const newUser = { id: `user-gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...data };
        return newUser;
      }),
    },
    queueEntry: {
      create: jest.fn(async ({ data }: any) => {
        const newEntry = {
          id: `entry-${queueEntriesStore.length + 1}`,
          ...data,
          joinedAt: new Date(),
          calledAt: null,
          servingAt: null,
          completedAt: null,
          cancelledAt: null,
          queue: customerCareQueue,
          user: {
            id: data.userId,
            fullName: data.userId === mobileUserId ? 'Alice Mobile' : data.userId === qrUserId ? 'Bob QR' : 'Kiosk Visitor',
            phoneNumber: '+233200000000',
          },
        };
        queueEntriesStore.push(newEntry);
        return newEntry;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.find((e) => e.id === where.id) || null;
      }),
      findFirst: jest.fn(async ({ where, orderBy }: any) => {
        let list = [...queueEntriesStore];
        if (orderBy?.position === 'desc') {
          list.sort((a, b) => (b.position || 0) - (a.position || 0));
        } else if (orderBy?.position === 'asc') {
          list.sort((a, b) => (a.position || 0) - (b.position || 0));
        }
        return list.find((e) => {
          if (where?.queueId && e.queueId !== where.queueId) return false;
          if (where?.userId && e.userId !== where.userId) return false;
          if (where?.status?.in && !where.status.in.includes(e.status)) return false;
          if (where?.status && typeof where.status === 'string' && e.status !== where.status) return false;
          return true;
        }) || null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.filter((e) => {
          if (where?.queue?.branchId && e.queue.branchId !== where.queue.branchId) return false;
          if (where?.queueId && e.queueId !== where.queueId) return false;
          if (where?.status?.in && !where.status.in.includes(e.status)) return false;
          if (where?.status && typeof where.status === 'string' && e.status !== where.status) return false;
          return true;
        });
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const entry = queueEntriesStore.find((e) => e.id === where.id);
        if (entry) {
          Object.assign(entry, data);
        }
        return entry;
      }),
      updateMany: jest.fn(async () => ({ count: 1 })),
      count: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.filter((e) => {
          if (where?.queueId && e.queueId !== where.queueId) return false;
          if (where?.status && e.status !== where.status) return false;
          if (where?.joinedAt?.lt && !(e.joinedAt < where.joinedAt.lt)) return false;
          return true;
        }).length;
      }),
    },
    ticketSequence: {
      upsert: jest.fn(async ({ create }: any) => {
        ticketSequenceCounter += 1;
        return {
          lastSequence: ticketSequenceCounter,
          prefix: create?.prefix || 'C',
        };
      }),
    },
    kiosk: {
      create: jest.fn(async ({ data }: any) => {
        const k = { id: `kiosk-${kiosksStore.length + 1}`, ...data, createdAt: new Date(), lastSeenAt: new Date() };
        kiosksStore.push(k);
        return k;
      }),
      findMany: jest.fn(async ({ where }: any) => kiosksStore.filter((k) => k.branchId === where.branchId)),
      findUnique: jest.fn(async ({ where }: any) => kiosksStore.find((k) => k.id === where.id)),
      update: jest.fn(async ({ where, data }: any) => {
        const k = kiosksStore.find((x) => x.id === where.id);
        if (k) Object.assign(k, data);
        return k;
      }),
    },
    serviceCounter: {
      create: jest.fn(async ({ data }: any) => {
        const c = { id: `counter-${countersStore.length + 1}`, ...data };
        countersStore.push(c);
        return c;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) return countersStore.find((c) => c.id === where.id);
        if (where.branchId_counterNumber) {
          return countersStore.find(
            (c) => c.branchId === where.branchId_counterNumber.branchId && c.counterNumber === where.branchId_counterNumber.counterNumber
          );
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }: any) => countersStore.filter((c) => c.branchId === where.branchId && c.isActive)),
      update: jest.fn(async ({ where, data }: any) => {
        const c = countersStore.find((x) => x.id === where.id);
        if (c) Object.assign(c, data);
        return c;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const matches = countersStore.filter((c) => c.branchId === where.branchId && c.counterNumber === where.counterNumber);
        matches.forEach((m) => Object.assign(m, data));
        return { count: matches.length };
      }),
    },
    lobbyDisplay: {
      findFirst: jest.fn(async ({ where }: any) => lobbyDisplaysStore.find((d) => d.branchId === where.branchId && d.isActive)),
      create: jest.fn(async ({ data }: any) => {
        const d = { id: `display-${lobbyDisplaysStore.length + 1}`, ...data };
        lobbyDisplaysStore.push(d);
        return d;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const d = lobbyDisplaysStore.find((x) => x.id === where.id);
        if (d) Object.assign(d, data);
        return d;
      }),
    },
    notification: {
      create: jest.fn(async ({ data }: any) => {
        const notif = { id: `notif-${notificationsStore.length + 1}`, ...data, createdAt: new Date() };
        notificationsStore.push(notif);
        return notif;
      }),
    },
    auditLog: {
      create: jest.fn(async ({ data }: any) => {
        auditLogsStore.push({ id: `audit-${auditLogsStore.length + 1}`, ...data, createdAt: new Date() });
        return {};
      }),
    },
    $transaction: jest.fn(async (cb: any) => await cb(mockTx)),
  };

  return {
    __esModule: true,
    default: mockTx,
  };
});

jest.mock('../index', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hash'),
}));

describe('Part 43: Complete End-to-End Physical Queue Acceptance Scenario', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    // Reset stores
    queueEntriesStore.length = 0;
    countersStore.length = 0;
    kiosksStore.length = 0;
    lobbyDisplaysStore.length = 0;
    notificationsStore.length = 0;
    auditLogsStore.length = 0;
    ticketSequenceCounter = 0;

    // Setup Branch A infrastructure
    // 1 Staff member (Kwame)
    // 2 Counters (Counter 1, Counter 2)
    // 1 Kiosk (Lobby Kiosk 1)
    // 1 Digital Lobby Display
    await counterService.createCounter({ branchId: branchAId, counterNumber: 'Counter 1', name: 'General Desk 1' }, staffUserId);
    await counterService.createCounter({ branchId: branchAId, counterNumber: 'Counter 2', name: 'General Desk 2' }, staffUserId);

    await kioskService.createKiosk({ branchId: branchAId, organizationId: orgAId, name: 'Lobby Kiosk Entrance' }, staffUserId);

    await lobbyService.upsertLobbyDisplay({
      branchId: branchAId,
      name: 'Main Waiting Hall Display',
      mode: LobbyDisplayMode.COMBINED,
      voiceEnabled: true,
    }, staffUserId);
  });

  it('executes the full 18-step unified physical service-center flow', async () => {
    // STEP 1: Mobile Customer (Alice) Joins Remote
    const aliceEntry = await queueService.joinQueue(mobileUserId, customerCareQueue.id, {
      isRemote: true,
      source: TicketSource.REMOTE,
    });
    expect(aliceEntry).toBeDefined();
    expect(aliceEntry.ticketNumber).toBe('C001');
    expect(aliceEntry.position).toBe(1);
    expect(aliceEntry.source).toBe(TicketSource.REMOTE);

    // STEP 2: QR Customer (Bob) Scans QR at branch entrance
    const bobEntry = await queueService.joinQueue(qrUserId, customerCareQueue.id, {
      isQr: true,
      source: TicketSource.QR,
    });
    expect(bobEntry).toBeDefined();
    expect(bobEntry.ticketNumber).toBe('C002');
    expect(bobEntry.position).toBe(2);
    expect(bobEntry.source).toBe(TicketSource.QR);

    // STEP 3: Kiosk Customer 1 (Charlie) touches kiosk screen and gets ticket
    const charlieTicket = await kioskService.issueKioskTicket({
      branchId: branchAId,
      serviceId: customerCareService.id,
      fullName: 'Charlie Kiosk',
      phoneNumber: '+233203333333',
    });
    expect(charlieTicket).toBeDefined();
    expect(charlieTicket.ticketNumber).toBe('C003');
    expect(charlieTicket.position).toBe(3);
    expect(charlieTicket.organizationName).toBe('Ghana Commercial Bank');
    expect(charlieTicket.branchName).toBe('Airport Branch');
    expect(charlieTicket.serviceName).toBe('Customer Care');

    // STEP 4: Kiosk Customer 2 (David) touches kiosk screen and gets ticket
    const davidTicket = await kioskService.issueKioskTicket({
      branchId: branchAId,
      serviceId: customerCareService.id,
      fullName: 'David Walk-in',
      phoneNumber: '+233204444444',
    });
    expect(davidTicket).toBeDefined();
    expect(davidTicket.ticketNumber).toBe('C004');
    expect(davidTicket.position).toBe(4);

    // STEP 5: Verify all 4 customers appear in the SAME unified service queue
    expect(queueEntriesStore).toHaveLength(4);
    const tickets = queueEntriesStore.map((e) => e.ticketNumber);
    expect(tickets).toEqual(['C001', 'C002', 'C003', 'C004']);

    // STEP 6: Staff (Kwame) views live queue
    const waitingList = queueEntriesStore.filter((e) => e.status === EntryStatus.WAITING);
    expect(waitingList).toHaveLength(4);
    expect(waitingList[0].ticketNumber).toBe('C001');

    // STEP 7: Staff calls first ticket (Alice) to Counter 1
    const calledAlice = await queueService.callNext(customerCareQueue.id, staffUserId, {
      counterNumber: 'Counter 1',
    });
    expect(calledAlice).not.toBeNull();
    expect(calledAlice!.ticketNumber).toBe('C001');
    expect(calledAlice!.status).toBe(EntryStatus.CALLING);
    expect(calledAlice!.counterNumber).toBe('Counter 1');

    // Counter 1 should now be SERVING C001
    const counter1 = countersStore.find((c) => c.counterNumber === 'Counter 1');
    expect(counter1.status).toBe('SERVING');
    expect(counter1.currentTicketNumber).toBe('C001');

    // STEP 8: Lobby display updates immediately
    const lobbyAfterCall = await lobbyService.getLobbyState(branchAId);
    expect(lobbyAfterCall.nowServing).toHaveLength(1);
    expect(lobbyAfterCall.nowServing[0].ticketNumber).toBe('C001');
    expect(lobbyAfterCall.nowServing[0].counterNumber).toBe('Counter 1');
    expect(lobbyAfterCall.announcement?.announcementText).toBe('Ticket C001, please proceed to Counter 1.');

    // STEP 9: Customer notification is generated through Phase 2 architecture
    const aliceNotif = notificationsStore.find(
      (n) => n.userId === mobileUserId && n.type === 'QUEUE_CALLED'
    );
    expect(aliceNotif).toBeDefined();
    expect(aliceNotif.priority).toBe('URGENT');
    expect(aliceNotif.message).toContain('C001');
    expect(aliceNotif.message).toContain('Counter 1');

    // STEP 10: Staff serves customer (Alice)
    const servingAlice = await queueService.startServing(calledAlice!.id, staffUserId, {
      counterNumber: 'Counter 1',
    });
    expect(servingAlice.status).toBe(EntryStatus.SERVING);

    // STEP 11: Customer completes service
    const completedAlice = await queueService.completeEntry(calledAlice!.id, staffUserId);
    expect(completedAlice.status).toBe(EntryStatus.COMPLETED);
    // Counter 1 resets to AVAILABLE
    expect(counter1.status).toBe('AVAILABLE');
    expect(counter1.currentTicketNumber).toBeNull();

    // STEP 12: Next customer (Bob) is called to Counter 1
    const calledBob = await queueService.callNext(customerCareQueue.id, staffUserId, {
      counterNumber: 'Counter 1',
    });
    expect(calledBob).not.toBeNull();
    expect(calledBob!.ticketNumber).toBe('C002');
    expect(calledBob!.status).toBe(EntryStatus.CALLING);

    // STEP 13: Lobby display updates to show Bob at Counter 1
    const lobbyAfterBobCall = await lobbyService.getLobbyState(branchAId);
    expect(lobbyAfterBobCall.nowServing[0].ticketNumber).toBe('C002');
    expect(lobbyAfterBobCall.announcement?.announcementText).toBe('Ticket C002, please proceed to Counter 1.');

    // STEP 14: Remaining queue positions & wait times reflect progress
    const remainingWaiting = queueEntriesStore.filter((e) => e.status === EntryStatus.WAITING);
    expect(remainingWaiting).toHaveLength(2); // Charlie (C003) and David (C004)
    expect(remainingWaiting[0].ticketNumber).toBe('C003');
    expect(remainingWaiting[1].ticketNumber).toBe('C004');

    // STEP 15: Controlled reprint test (Customer lost paper ticket)
    const reprintedTicket = await ticketPrintService.reprintTicket(
      remainingWaiting[0].id,
      'Customer misplaced paper slip',
      staffUserId
    );
    expect(reprintedTicket.ticketNumber).toBe('C003');
    expect(reprintedTicket.reprintCount).toBe(1);

    // STEP 16: Concurrency and uniqueness validation: No duplicate tickets were generated
    const allGeneratedTickets = queueEntriesStore.map((e) => e.ticketNumber);
    const uniqueTickets = new Set(allGeneratedTickets);
    expect(uniqueTickets.size).toBe(allGeneratedTickets.length);

    // STEP 17: Audit logs verify full lifecycle events
    const auditActions = auditLogsStore.map((a) => a.action);
    expect(auditActions).toContain('COUNTER_CREATED');
    expect(auditActions).toContain('REMOTE_QUEUE_JOINED');
    expect(auditActions).toContain('QR_JOIN_SUCCESS');
    expect(auditActions).toContain('KIOSK_TICKET_CREATED');
    expect(auditActions).toContain('STAFF_CALLED_CUSTOMER');
    expect(auditActions).toContain('STAFF_STARTED_SERVING');
    expect(auditActions).toContain('SERVICE_COMPLETED');
    expect(auditActions).toContain('TICKET_REPRINTED');

    // STEP 18: Tenant Isolation: Another organization (Organization B / Branch B) cannot access these records
    // Branch B kiosk query returns 0 services
    const branchBServices = await kioskService.getKioskBranchServices(branchBId);
    expect(branchBServices.services).toHaveLength(0);

    // Branch B lobby query returns 0 nowServing tickets
    const branchBLobby = await lobbyService.getLobbyState(branchBId);
    expect(branchBLobby.nowServing).toHaveLength(0);

    // Branch B staff cannot manage Counter 1 of Branch A
    await expect(
      counterService.assignStaffToCounter(counter1.id, 'user-staff-branch-b')
    ).rejects.toThrow();
  });
});
