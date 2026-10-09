import prisma from '../config/prisma';
import * as ticketNumberService from './ticketNumberService';
import * as ticketPrintService from './ticketPrintService';
import * as kioskService from './kioskService';
import * as counterService from './counterService';
import * as lobbyService from './lobbyService';
import { EntryStatus, CounterStatus, LobbyDisplayMode, PriorityLevel } from '@prisma/client';

jest.mock('../config/prisma', () => {
  const mPrisma: any = {
    branch: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    queue: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    queueEntry: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn(),
    },
    ticketSequence: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    kiosk: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceCounter: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      delete: jest.fn(),
    },
    lobbyDisplay: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(async (cb: any) => await cb(mPrisma)),
  };
  return {
    __esModule: true,
    default: mPrisma,
  };
});

jest.mock('../index', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  },
}));

jest.mock('./etaService', () => ({
  calculateQueueEta: jest.fn().mockResolvedValue({
    estimatedWaitTimeMinutes: 18,
    dynamicPaceMinutes: 15,
    baselineDurationMinutes: 15,
  }),
}));

describe('Phase 3: Physical Queue, Kiosk, Walk-In Ticketing & Lobby Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Concurrency-Safe Deterministic Ticket Numbering (Part 4)', () => {
    it('generates deterministic padded ticket numbers with correct service prefix', async () => {
      (prisma.ticketSequence.upsert as jest.Mock).mockResolvedValueOnce({
        lastSequence: 23,
      });

      const ticketNumber = await ticketNumberService.generateTicketNumber({
        branchId: 'branch-1',
        serviceId: 'srv-1',
        serviceName: 'Customer Care',
      });

      expect(ticketNumber).toBe('C023');
      expect(prisma.ticketSequence.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId_serviceId_dateKey: expect.objectContaining({
              branchId: 'branch-1',
              serviceId: 'srv-1',
            }),
          }),
        })
      );
    });

    it('simulates concurrent ticket generation ensuring consecutive distinct numbers (Critical Concurrency Test)', async () => {
      let currentSeq = 22;
      (prisma.ticketSequence.upsert as jest.Mock).mockImplementation(async () => {
        currentSeq += 1;
        return { lastSequence: currentSeq };
      });

      // Simulate two kiosk devices issuing tickets at the exact same moment
      const [ticketA, ticketB] = await Promise.all([
        ticketNumberService.generateTicketNumber({
          branchId: 'branch-1',
          serviceId: 'srv-1',
          serviceName: 'Accounts',
        }),
        ticketNumberService.generateTicketNumber({
          branchId: 'branch-1',
          serviceId: 'srv-1',
          serviceName: 'Accounts',
        }),
      ]);

      expect(ticketA).toBe('A023');
      expect(ticketB).toBe('A024');
      expect(ticketA).not.toBe(ticketB);
    });

    it('falls back safely to count strategy when TicketSequence table is unavailable', async () => {
      const origUpsert = prisma.ticketSequence.upsert;
      (prisma.ticketSequence as any).upsert = undefined;

      (prisma.queueEntry.count as jest.Mock).mockResolvedValueOnce(5);

      const ticketNumber = await ticketNumberService.generateTicketNumber({
        branchId: 'branch-1',
        serviceId: 'srv-2',
        serviceName: 'Billing',
      });

      expect(ticketNumber).toBe('B006');
      (prisma.ticketSequence as any).upsert = origUpsert;
    });
  });

  describe('2. Kiosk Service Selection & Filtering (Part 6 & 8)', () => {
    it('returns only active services with open walk-in queues for the branch', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        name: 'Osu Branch',
        isActive: true,
        organization: { id: 'org-1', name: 'QueueLess Org', logo: null },
      });

      (prisma.service.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'srv-1',
          name: 'Customer Care',
          duration: 15,
          allowWalkIn: true,
          isActive: true,
          queues: [{ id: 'q-1', status: 'OPEN', capacity: 50 }],
        },
      ]);

      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(4);

      const result = await kioskService.getKioskBranchServices('branch-1');

      expect(result.branch.name).toBe('Osu Branch');
      expect(result.services).toHaveLength(1);
      expect(result.services[0].name).toBe('Customer Care');
      expect(result.services[0].waitingCount).toBe(4);
    });

    it('rejects access if the branch is inactive', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-inactive',
        isActive: false,
      });

      await expect(kioskService.getKioskBranchServices('branch-inactive')).rejects.toThrow(
        /inactive or not found/i
      );
    });

    it('rejects ticket creation if queue is at maximum capacity (Part 28)', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        isActive: true,
        organizationId: 'org-1',
      });

      (prisma.service.findUnique as jest.Mock).mockResolvedValue({
        id: 'srv-1',
        name: 'Passport Services',
        branchId: 'branch-1',
        isActive: true,
        allowWalkIn: true,
        queues: [{ id: 'q-1', status: 'OPEN', capacity: 10 }],
      });

      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(10); // Queue full

      await expect(
        kioskService.issueKioskTicket({
          branchId: 'branch-1',
          serviceId: 'srv-1',
        })
      ).rejects.toThrow(/queue is currently full/i);
    });

    it('rejects ticket creation if service has walk-ins disabled', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        isActive: true,
      });

      (prisma.service.findUnique as jest.Mock).mockResolvedValue({
        id: 'srv-vip',
        name: 'VIP Private Service',
        branchId: 'branch-1',
        isActive: true,
        allowWalkIn: false,
        queues: [{ id: 'q-vip', status: 'OPEN' }],
      });

      await expect(
        kioskService.issueKioskTicket({
          branchId: 'branch-1',
          serviceId: 'srv-vip',
        })
      ).rejects.toThrow(/disabled for this service/i);
    });
  });

  describe('3. Ticket Printing & Controlled Reprint (Part 9, 10, 11)', () => {
    it('generates public-safe printable ticket data stripping all customer personal data', async () => {
      (prisma.queueEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        ticketNumber: 'A023',
        position: 7,
        joinedAt: new Date('2026-09-25T10:42:00Z'),
        counterNumber: null,
        reprintCount: 0,
        source: 'KIOSK',
        queue: {
          id: 'q-1',
          service: { id: 'srv-1', name: 'Customer Care', duration: 15 },
          branch: {
            id: 'b-1',
            name: 'Airport Branch',
            location: 'Terminal 3',
            organization: { name: 'Ghana Commercial Bank' },
          },
        },
        user: { id: 'u-1', fullName: 'Secret VIP Name', phoneNumber: '+233240000000' },
      });

      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(6);

      const ticket = await ticketPrintService.generatePrintableTicketData('entry-1');

      expect(ticket.ticketNumber).toBe('A023');
      expect(ticket.organizationName).toBe('Ghana Commercial Bank');
      expect(ticket.branchName).toBe('Airport Branch');
      expect(ticket.serviceName).toBe('Customer Care');
      expect(ticket.position).toBe(7);
      expect(ticket.peopleAhead).toBe(6);
      expect(ticket.estimatedWaitMinutes).toBe(18);
      // Privacy check: ensure private customer details are not exposed in ticket object
      expect((ticket as any).user).toBeUndefined();
      expect((ticket as any).customerName).toBeUndefined();
      expect((ticket as any).phoneNumber).toBeUndefined();
    });

    it('performs controlled reprint and increments reprintCount with audit log', async () => {
      (prisma.queueEntry.findUnique as jest.Mock).mockResolvedValue({
        id: 'entry-reprint',
        ticketNumber: 'B014',
        position: 3,
        joinedAt: new Date(),
        reprintCount: 1,
        queue: {
          id: 'q-1',
          service: { id: 'srv-2', name: 'Teller Service' },
          branch: {
            id: 'b-1',
            name: 'Tema Branch',
            organizationId: 'org-1',
            organization: { name: 'Bank of Ghana' },
          },
        },
      });

      const reprinted = await ticketPrintService.reprintTicket(
        'entry-reprint',
        'Customer lost paper slip',
        'staff-123'
      );

      expect(prisma.queueEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'entry-reprint' },
          data: expect.objectContaining({
            reprintCount: 2,
            lastReprintedBy: 'staff-123',
          }),
        })
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TICKET_REPRINTED',
            details: expect.stringContaining('entry-reprint'),
          }),
        })
      );
      const auditCall = (prisma.auditLog.create as jest.Mock).mock.calls[0][0];
      const parsedDetails = JSON.parse(auditCall.data.details);
      expect(parsedDetails.ticketNumber).toBe('B014');
      expect(parsedDetails.reprintCount).toBe(2);
      expect(parsedDetails.reason).toBe('Customer lost paper slip');
    });
  });

  describe('4. Counter Management & Branch Isolation (Part 22, 23, 36)', () => {
    it('creates a service counter within the branch scope', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        organizationId: 'org-1',
      });
      (prisma.serviceCounter.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.serviceCounter.create as jest.Mock).mockResolvedValue({
        id: 'counter-1',
        branchId: 'branch-1',
        counterNumber: 'Counter 2',
        name: 'Teller Desk 2',
        status: CounterStatus.AVAILABLE,
      });

      const counter = await counterService.createCounter(
        {
          branchId: 'branch-1',
          counterNumber: 'Counter 2',
          name: 'Teller Desk 2',
        },
        'staff-1'
      );

      expect(counter.counterNumber).toBe('Counter 2');
      expect(prisma.serviceCounter.create).toHaveBeenCalled();
    });

    it('rejects duplicate counter numbers in the same branch', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
      });
      (prisma.serviceCounter.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-counter',
        counterNumber: 'Counter 1',
      });

      await expect(
        counterService.createCounter({
          branchId: 'branch-1',
          counterNumber: 'Counter 1',
        })
      ).rejects.toThrow(/already exists/i);
    });

    it('enforces branch isolation when assigning staff to a counter', async () => {
      (prisma.serviceCounter.findUnique as jest.Mock).mockResolvedValue({
        id: 'cnt-1',
        branchId: 'branch-A',
        branch: { id: 'branch-A' },
      });
      // Staff belongs to Branch B
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'staff-from-branch-b',
        staffBranchId: 'branch-B',
      });

      await expect(
        counterService.assignStaffToCounter('cnt-1', 'staff-from-branch-b')
      ).rejects.toThrow(/not authorized for counters in this branch/i);
    });
  });

  describe('5. Lobby TV Display & Real-Time Privacy (Part 18, 19, 32)', () => {
    it('generates privacy-sanitized lobby state without customer names or phone numbers', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        name: 'Takoradi Branch',
        isActive: true,
        organizationId: 'org-1',
        organization: { id: 'org-1', name: 'Enterprise Life' },
      });

      (prisma.queueEntry.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'entry-calling-1',
          ticketNumber: 'A023',
          counterNumber: 'Counter 2',
          status: EntryStatus.CALLING,
          calledAt: new Date(),
          servingAt: null,
          queue: {
            service: { id: 'srv-1', name: 'Claims Settlement', duration: 15 },
          },
          // Even if database has customer details, the lobby service MUST exclude them
          user: { fullName: 'Kwame Mensah', phoneNumber: '0241234567' },
        },
      ]);

      (prisma.service.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'srv-1',
          name: 'Claims Settlement',
          duration: 15,
          queues: [{ id: 'q-1' }],
          counters: [{ id: 'cnt-1' }],
        },
      ]);

      (prisma.queueEntry.count as jest.Mock).mockResolvedValue(5);

      const lobby = await lobbyService.getLobbyState('branch-1');

      expect(lobby.branch.name).toBe('Takoradi Branch');
      expect(lobby.nowServing).toHaveLength(1);
      expect(lobby.nowServing[0].ticketNumber).toBe('A023');
      expect(lobby.nowServing[0].counterNumber).toBe('Counter 2');
      expect(lobby.nowServing[0].serviceName).toBe('Claims Settlement');

      // Crucial privacy verification: No PII fields present in nowServing
      expect((lobby.nowServing[0] as any).user).toBeUndefined();
      expect((lobby.nowServing[0] as any).fullName).toBeUndefined();
      expect((lobby.nowServing[0] as any).phoneNumber).toBeUndefined();

      // Announcement check
      expect(lobby.announcement?.announcementText).toBe(
        'Ticket A023, please proceed to Counter 2.'
      );
    });

    it('correctly configures display modes (Mode A: NOW_SERVING, Mode B: QUEUE_OVERVIEW, Mode C: COMBINED)', async () => {
      (prisma.branch.findUnique as jest.Mock).mockResolvedValue({
        id: 'branch-1',
        organizationId: 'org-1',
      });
      (prisma.lobbyDisplay.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lobbyDisplay.create as jest.Mock).mockResolvedValue({
        id: 'display-1',
        branchId: 'branch-1',
        mode: LobbyDisplayMode.NOW_SERVING,
        voiceEnabled: true,
      });

      const display = await lobbyService.upsertLobbyDisplay(
        {
          branchId: 'branch-1',
          mode: LobbyDisplayMode.NOW_SERVING,
          voiceEnabled: true,
        },
        'staff-admin'
      );

      expect(display.mode).toBe(LobbyDisplayMode.NOW_SERVING);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'LOBBY_DISPLAY_CONFIG_UPDATED',
          }),
        })
      );
    });
  });
});
