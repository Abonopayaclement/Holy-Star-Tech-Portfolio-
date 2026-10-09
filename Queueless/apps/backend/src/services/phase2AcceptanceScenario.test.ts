import * as queueService from './queueService';
import * as appointmentService from './appointmentService';
import * as callbackService from './callbackService';
import * as messageService from './messageService';
import prisma from '../config/prisma';
import {
  NotificationPreference,
  CallbackStatus,
  CallbackThreshold,
  Role,
  SenderType,
  AppointmentStatus,
  NotificationPriority,
} from '@prisma/client';

const orgId = 'org-acc-telecom';
const branchId = 'branch-acc-bolga';
const customerId = 'user-acc-alice';
const staffId = 'user-acc-staff-bolga';

const org = { id: orgId, name: 'Telecom Company', type: 'TELECOM' };
const branch = {
  id: branchId,
  name: 'Bolga Branch',
  organizationId: orgId,
  organization: org,
  location: 'Bolga Main St',
  qrCodeId: 'qr-acc-bolga',
  isActive: true,
};

const aliceUser = {
  id: customerId,
  email: 'alice.telecom@test.com',
  fullName: 'Alice',
  role: Role.CUSTOMER,
};

const kwameStaff = {
  id: staffId,
  email: 'staff.bolga@telecom.test',
  fullName: 'Kwame (Staff)',
  role: Role.STAFF,
  organizationId: orgId,
  staffBranchId: branchId,
};

const simRegService = {
  id: 'svc-sim-reg',
  branchId,
  name: 'SIM Registration',
  duration: 10,
  price: 0,
  isActive: true,
  allowRemoteJoin: true,
  branch,
  queues: [{ id: 'q-sim-reg', branchId, status: 'OPEN', priorityRatio: 2, consecutivePriorityCount: 0 }],
};

const custSupportService = {
  id: 'svc-cust-support',
  branchId,
  name: 'Customer Support',
  duration: 15,
  price: 25.0,
  isActive: true,
  allowRemoteJoin: true,
  branch,
  queues: [{ id: 'q-cust-support', branchId, status: 'OPEN', priorityRatio: 2, consecutivePriorityCount: 0 }],
};

const simRegQueue = {
  id: 'q-sim-reg',
  branchId,
  serviceId: simRegService.id,
  status: 'OPEN',
  service: simRegService,
  branch,
};

const custSupportQueue = {
  id: 'q-cust-support',
  branchId,
  serviceId: custSupportService.id,
  status: 'OPEN',
  service: custSupportService,
  branch,
};

const queueEntriesStore: any[] = [];
const callbacksStore: any[] = [];
const notificationsStore: any[] = [];
const conversationsStore: any[] = [];
const messagesStore: any[] = [];
const appointmentsStore: any[] = [];
const paymentsStore: any[] = [];

jest.mock('../config/prisma', () => {
  const mockTx: any = {
    organization: {
      findUnique: jest.fn(async ({ where }: any) => (where.id === orgId ? org : null)),
    },
    branch: {
      findUnique: jest.fn(async ({ where }: any) => (where.id === branchId ? branch : null)),
    },
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === customerId) return aliceUser;
        if (where.id === staffId) return kwameStaff;
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const u = where.id === customerId ? aliceUser : kwameStaff;
        Object.assign(u, data);
        return u;
      }),
    },
    service: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === simRegService.id) return simRegService;
        if (where.id === custSupportService.id) return custSupportService;
        return null;
      }),
    },
    queue: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === simRegQueue.id) return simRegQueue;
        if (where.id === custSupportQueue.id) return custSupportQueue;
        return null;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        if (where.serviceId === simRegService.id) return simRegQueue;
        if (where.serviceId === custSupportService.id) return custSupportQueue;
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const q = where.id === simRegQueue.id ? simRegQueue : custSupportQueue;
        Object.assign(q, data);
        return q;
      }),
    },
    queueEntry: {
      create: jest.fn(async ({ data }: any) => {
        const q = data.queueId === simRegQueue.id ? simRegQueue : custSupportQueue;
        const entry = {
          id: 'entry-' + Math.random().toString(36).slice(2),
          ticketNumber: 'T-001',
          position: 1,
          status: 'WAITING',
          joinedAt: new Date(),
          ...data,
          queue: q,
          user: aliceUser,
        };
        queueEntriesStore.push(entry);
        return entry;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.find((e) => e.id === where.id) || null;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.find((e) => {
          if (where.userId && e.userId !== where.userId) return false;
          if (where.queueId && e.queueId !== where.queueId) return false;
          return true;
        }) || null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.filter((e) => {
          if (where.queueId && e.queueId !== where.queueId) return false;
          if (where.status && e.status !== where.status) return false;
          return true;
        });
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const entry = queueEntriesStore.find((e) => e.id === where.id);
        if (entry) {
          if (data.queueId) {
            entry.queueId = data.queueId;
            entry.queue = data.queueId === simRegQueue.id ? simRegQueue : custSupportQueue;
          }
          Object.assign(entry, data);
        }
        return entry;
      }),
      count: jest.fn(async ({ where }: any) => {
        return queueEntriesStore.filter((e) => {
          if (where.queueId && e.queueId !== where.queueId) return false;
          if (where.status && e.status !== where.status) return false;
          return true;
        }).length;
      }),
    },
    callbackRequest: {
      create: jest.fn(async ({ data }: any) => {
        const entry = queueEntriesStore.find((e) => e.id === data.queueEntryId);
        const cb = {
          id: 'cb-' + Math.random().toString(36).slice(2),
          status: CallbackStatus.ACTIVE,
          createdAt: new Date(),
          ...data,
          queueEntry: entry || {
            queue: simRegQueue,
            user: aliceUser,
          },
        };
        callbacksStore.push(cb);
        return cb;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return callbacksStore.filter((c) => {
          if (where?.queueEntryId && c.queueEntryId !== where.queueEntryId) return false;
          if (where?.status) {
            if (typeof where.status === 'object' && Array.isArray(where.status.in)) {
              if (!where.status.in.includes(c.status)) return false;
            } else if (c.status !== where.status) return false;
          }
          if (where?.threshold) {
            if (typeof where.threshold === 'object' && Array.isArray(where.threshold.in)) {
              if (!where.threshold.in.includes(c.threshold)) return false;
            } else if (c.threshold !== where.threshold) return false;
          }
          return true;
        });
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return callbacksStore.find((c) => {
          if (where?.queueEntryId && c.queueEntryId !== where.queueEntryId) return false;
          if (where?.userId && c.userId !== where.userId) return false;
          if (where?.status) {
            if (typeof where.status === 'object' && Array.isArray(where.status.in)) {
              if (!where.status.in.includes(c.status)) return false;
            } else if (c.status !== where.status) return false;
          }
          if (where?.threshold) {
            if (typeof where.threshold === 'object' && Array.isArray(where.threshold.in)) {
              if (!where.threshold.in.includes(c.threshold)) return false;
            } else if (c.threshold !== where.threshold) return false;
          }
          return true;
        }) || null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return callbacksStore.find((c) => c.id === where.id) || null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const cb = callbacksStore.find((c) => c.id === where.id);
        if (cb) Object.assign(cb, data);
        return cb;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        callbacksStore.forEach((c) => {
          let match = true;
          if (where?.queueEntryId && c.queueEntryId !== where.queueEntryId) match = false;
          if (where?.status) {
            if (typeof where.status === 'object' && Array.isArray(where.status.in)) {
              if (!where.status.in.includes(c.status)) match = false;
            } else if (c.status !== where.status) match = false;
          }
          if (where?.threshold) {
            if (typeof where.threshold === 'object' && Array.isArray(where.threshold.in)) {
              if (!where.threshold.in.includes(c.threshold)) match = false;
            } else if (c.threshold !== where.threshold) match = false;
          }
          if (match) {
            Object.assign(c, data);
            count++;
          }
        });
        return { count };
      }),
    },
    notification: {
      create: jest.fn(async ({ data }: any) => {
        const notif = {
          id: 'notif-' + Math.random().toString(36).slice(2),
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          priority: data.priority || NotificationPriority.NORMAL,
          ...data,
        };
        notificationsStore.push(notif);
        return notif;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return notificationsStore.filter((n) => {
          if (where.userId && n.userId !== where.userId) return false;
          if (where.branchId && n.branchId !== where.branchId) return false;
          if (where.type && n.type !== where.type) return false;
          if (where.entityId && n.entityId !== where.entityId) return false;
          return true;
        });
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return notificationsStore.find((n) => {
          if (where.userId && n.userId !== where.userId) return false;
          if (where.branchId && n.branchId !== where.branchId) return false;
          if (where.type && n.type !== where.type) return false;
          if (where.entityId && n.entityId !== where.entityId) return false;
          return true;
        }) || null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return notificationsStore.find((n) => n.id === where.id) || null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const notif = notificationsStore.find((n) => n.id === where.id);
        if (notif) Object.assign(notif, data);
        return notif;
      }),
      count: jest.fn(async ({ where }: any) => {
        return notificationsStore.filter((n) => {
          if (where.userId && n.userId !== where.userId) return false;
          if (where.type && n.type !== where.type) return false;
          return true;
        }).length;
      }),
    },
    notificationDelivery: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'deliv-' + Math.random().toString(36).slice(2),
        ...data,
        status: 'SENT',
        sentAt: new Date(),
      })),
      findMany: jest.fn(async () => []),
    },
    conversation: {
      findFirst: jest.fn(async ({ where }: any) => {
        return conversationsStore.find((c) => {
          if (where.organizationId && c.organizationId !== where.organizationId) return false;
          if (where.branchId && c.branchId !== where.branchId) return false;
          if (where.customerId && c.customerId !== where.customerId) return false;
          if (where.queueEntryId && c.queueEntryId !== where.queueEntryId) return false;
          return true;
        }) || null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return conversationsStore.find((c) => c.id === where.id) || null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const entry = queueEntriesStore.find((e) => e.id === data.queueEntryId);
        const conv = {
          id: 'conv-' + Math.random().toString(36).slice(2),
          customer: aliceUser,
          staff: data.staffId ? kwameStaff : null,
          queueEntry: entry,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        conversationsStore.push(conv);
        return conv;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const c = conversationsStore.find((x) => x.id === where.id);
        if (c) Object.assign(c, data);
        return c;
      }),
    },
    message: {
      create: jest.fn(async ({ data }: any) => {
        const msg = {
          id: 'msg-' + Math.random().toString(36).slice(2),
          sender: data.senderId === customerId ? aliceUser : kwameStaff,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          ...data,
        };
        messagesStore.push(msg);
        return msg;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return messagesStore.filter(
          (m) => !where.conversationId || m.conversationId === where.conversationId
        );
      }),
      count: jest.fn(async ({ where }: any) => {
        return messagesStore.filter((m) => {
          if (where.conversationId && m.conversationId !== where.conversationId) return false;
          if (where.senderId && m.senderId !== where.senderId) return false;
          return true;
        }).length;
      }),
      updateMany: jest.fn(async () => ({ count: 1 })),
    },
    appointment: {
      create: jest.fn(async ({ data }: any) => {
        const appt = {
          id: 'appt-' + Math.random().toString(36).slice(2),
          status: AppointmentStatus.PENDING,
          branch,
          service: custSupportService,
          user: aliceUser,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        appointmentsStore.push(appt);
        return appt;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return appointmentsStore.find((a) => a.id === where.id) || null;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return appointmentsStore.find((a) => {
          if (where.userId && a.userId !== where.userId) return false;
          if (where.branchId && a.branchId !== where.branchId) return false;
          return true;
        }) || null;
      }),
      findMany: jest.fn(async () => appointmentsStore),
      update: jest.fn(async ({ where, data }: any) => {
        const appt = appointmentsStore.find((a) => a.id === where.id);
        if (appt) {
          Object.assign(appt, data);
          if (data.fee !== undefined) appt.fee = data.fee;
          if (data.status !== undefined) appt.status = data.status;
        }
        return appt;
      }),
    },
    payment: {
      create: jest.fn(async ({ data }: any) => {
        const payment = {
          id: 'pay-' + Math.random().toString(36).slice(2),
          ...data,
          createdAt: new Date(),
        };
        paymentsStore.push(payment);
        return payment;
      }),
    },
    userDevice: {
      findMany: jest.fn(async () => []),
    },
    auditLog: {
      create: jest.fn(async () => ({ id: 'audit-log-1' })),
    },
  };

  return {
    __esModule: true,
    default: {
      ...mockTx,
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
    },
  };
});

describe('Phase 2 Acceptance Scenarios (Parts 34 & 35)', () => {
  describe('Part 34 — Complete End-to-End Queue, Callback & Messaging Acceptance Scenario', () => {
    let aliceEntry: any;
    let conversationId: string;

    it('Step 1: Alice joins remotely with NOTIFY_APPROACHING_5 preference', async () => {
      aliceEntry = await queueService.joinQueue(customerId, simRegQueue.id, {
        isRemote: true,
        notificationPreference: NotificationPreference.NOTIFY_APPROACHING_5,
      });

      expect(aliceEntry).toBeDefined();
      expect(aliceEntry.ticketNumber).toBeDefined();
      expect(aliceEntry.notificationPreference).toBe(NotificationPreference.NOTIFY_APPROACHING_5);

      // Verify active callback created
      const activeCb = await callbackService.getActiveCallbackForEntry(aliceEntry.id, customerId);
      expect(activeCb).toBeDefined();
      expect(activeCb?.threshold).toBe(CallbackThreshold.APPROACHING_5);
      expect(activeCb?.status).toBe(CallbackStatus.ACTIVE);
    });

    it('Step 2: Queue progresses to 5 people ahead, sending one notification and no duplicates on progress', async () => {
      // Proximity check at 5 ahead
      await callbackService.evaluateCallbacksForEntry({
        queueEntryId: aliceEntry.id,
        peopleAhead: 5,
        isCalled: false,
      });

      // Callback triggered
      const triggeredCb = await callbackService.getActiveCallbackForEntry(aliceEntry.id, customerId);
      expect(triggeredCb?.status).toBe(CallbackStatus.TRIGGERED);

      // Verify only 1 notification created
      const notifs = await prisma.notification.findMany({
        where: {
          userId: customerId,
          type: 'QUEUE_APPROACHING_5',
        },
      });
      expect(notifs.length).toBe(1);

      // Queue continues to progress; deduplication prevents additional notifications
      await callbackService.evaluateCallbacksForEntry({
        queueEntryId: aliceEntry.id,
        peopleAhead: 4,
        isCalled: false,
      });

      const notifsAfterProgress = await prisma.notification.findMany({
        where: {
          userId: customerId,
          type: 'QUEUE_APPROACHING_5',
        },
      });
      expect(notifsAfterProgress.length).toBe(1);
    });

    it('Step 3: Alice changes preference to NOTIFY_APPROACHING_2, cancelling old 5-person callback', async () => {
      await queueService.updateNotificationPreference(
        aliceEntry.id,
        customerId,
        NotificationPreference.NOTIFY_APPROACHING_2
      );

      // Previous 5-person callback must be CANCELLED
      const oldCallbacks = await prisma.callbackRequest.findMany({
        where: {
          queueEntryId: aliceEntry.id,
          threshold: CallbackThreshold.APPROACHING_5,
        },
      });
      expect(oldCallbacks.every((c: { status: CallbackStatus }) => c.status === CallbackStatus.CANCELLED)).toBe(true);

      // New 2-person callback is ACTIVE
      const activeCb = await callbackService.getActiveCallbackForEntry(aliceEntry.id, customerId);
      expect(activeCb).toBeDefined();
      expect(activeCb?.threshold).toBe(CallbackThreshold.APPROACHING_2);
      expect(activeCb?.status).toBe(CallbackStatus.ACTIVE);
    });

    it('Step 4: Queue reaches two people ahead; QueueLess sends one notification for 2 ahead', async () => {
      await callbackService.evaluateCallbacksForEntry({
        queueEntryId: aliceEntry.id,
        peopleAhead: 2,
        isCalled: false,
      });

      const triggeredCb = await callbackService.getActiveCallbackForEntry(aliceEntry.id, customerId);
      expect(triggeredCb?.status).toBe(CallbackStatus.TRIGGERED);

      const notifs2 = await prisma.notification.findMany({
        where: {
          userId: customerId,
          type: 'QUEUE_APPROACHING_2',
        },
      });
      expect(notifs2.length).toBe(1);
    });

    it('Step 5: Staff transfers Alice to Customer Support; updates service, preserves history, and sends transfer notification', async () => {
      const transferred = await queueService.transferTicket(
        aliceEntry.id,
        custSupportService.id,
        staffId,
        { reason: 'Customer needs complex billing support' }
      );

      expect(transferred.queueId).toBe(custSupportQueue.id);
      expect(transferred.originalServiceId).toBe(simRegService.id);
      expect(transferred.transferReason).toBe('Customer needs complex billing support');

      // Verify transfer notification sent to Alice
      const transferNotif = await prisma.notification.findFirst({
        where: {
          userId: customerId,
          type: 'QUEUE_TRANSFERRED',
        },
      });
      expect(transferNotif).toBeDefined();
      expect(transferNotif?.message).toContain('Customer Support');
      expect(transferNotif?.entityId).toBe(aliceEntry.id);
    });

    it('Step 6: Staff and Alice exchange messages scoped to Telecom Company Bolga Branch', async () => {
      // 1. Initialize scoped conversation
      const conv = await messageService.getOrCreateConversation({
        userId: customerId,
        role: Role.CUSTOMER,
        queueEntryId: aliceEntry.id,
      });

      expect(conv.organizationId).toBe(orgId);
      expect(conv.branchId).toBe(branchId);
      conversationId = conv.id;

      // 2. Staff sends: "Please have your Ghana Card ready."
      const staffMsg = await messageService.sendMessage({
        conversationId,
        senderId: staffId,
        senderRole: Role.STAFF,
        message: 'Please have your Ghana Card ready.',
      });
      expect(staffMsg.message).toBe('Please have your Ghana Card ready.');
      expect(staffMsg.senderType).toBe(SenderType.STAFF);

      // 3. Alice receives and replies: "Okay."
      const aliceMsg = await messageService.sendMessage({
        conversationId,
        senderId: customerId,
        senderRole: Role.CUSTOMER,
        message: 'Okay.',
      });
      expect(aliceMsg.message).toBe('Okay.');
      expect(aliceMsg.senderType).toBe(SenderType.CUSTOMER);

      // 4. Retrieve conversation history
      const history = await messageService.getConversationMessages(conversationId, customerId, Role.CUSTOMER);
      expect(history.length).toBe(2);
      expect(history[0].message).toBe('Please have your Ghana Card ready.');
      expect(history[1].message).toBe('Okay.');
    });
  });

  describe('Part 35 — Complete Appointment Acceptance Scenario', () => {
    let appointmentId: string;

    it('Step 1: Customer submits remote appointment request and receives confirmation notification', async () => {
      const appt = await appointmentService.createRemoteAppointmentRequest({
        userId: customerId,
        branchId,
        serviceId: custSupportService.id,
        problemType: 'Billing Overcharge Inquiry',
        notes: 'Incorrect fee deducted from mobile money account',
      });

      expect(appt).toBeDefined();
      expect(appt.status).toBe(AppointmentStatus.PENDING);
      appointmentId = appt.id;

      // Check request notification
      const notif = await prisma.notification.findFirst({
        where: {
          userId: customerId,
          type: 'APPOINTMENT_REQUESTED',
        },
      });
      expect(notif).toBeDefined();
      expect(notif?.entityId).toBe(appointmentId);
    });

    it('Step 2: Staff approves appointment requiring GHS 25 fee; customer receives PAYMENT_REQUIRED notification', async () => {
      const approved = await appointmentService.approveAppointment(
        appointmentId,
        25.0,
        { id: staffId, fullName: 'Kwame' }
      );

      expect(approved.status).toBe(AppointmentStatus.APPROVED);
      expect(Number(approved.fee)).toBe(25.0);

      const paymentReqNotif = await prisma.notification.findFirst({
        where: {
          userId: customerId,
          type: 'PAYMENT_REQUIRED',
        },
      });
      expect(paymentReqNotif).toBeDefined();
      expect(paymentReqNotif?.entityId).toBe(appointmentId);
      expect(paymentReqNotif?.message).toContain('25.00');
    });

    it('Step 3: Customer completes test payment; customer receives PAYMENT_COMPLETED notification', async () => {
      const paid = await appointmentService.confirmAndPayAppointment(
        appointmentId,
        customerId
      );

      expect(paid.status).toBe(AppointmentStatus.PAID);
      expect(paid.paidAt).toBeDefined();

      const paymentNotif = await prisma.notification.findFirst({
        where: {
          userId: customerId,
          type: 'APPOINTMENT_PAYMENT_COMPLETED',
        },
      });
      expect(paymentNotif).toBeDefined();
      expect(paymentNotif?.message).toContain('25.00');
    });

    it('Step 4: Staff starts appointment; customer receives APPOINTMENT_STARTED notification', async () => {
      const started = await appointmentService.startAppointmentService(
        appointmentId,
        { id: staffId, fullName: 'Kwame' }
      );

      expect(started.status).toBe(AppointmentStatus.IN_PROGRESS);

      const startedNotif = await prisma.notification.findFirst({
        where: {
          userId: customerId,
          type: 'APPOINTMENT_STARTED',
        },
      });
      expect(startedNotif).toBeDefined();
      expect(startedNotif?.entityId).toBe(appointmentId);
    });

    it('Step 5: Staff completes appointment; customer receives APPOINTMENT_COMPLETED notification requesting feedback', async () => {
      const completed = await appointmentService.completeAppointmentService(
        appointmentId,
        { id: staffId, fullName: 'Kwame' }
      );

      expect(completed.status).toBe(AppointmentStatus.COMPLETED);

      const completedNotif = await prisma.notification.findFirst({
        where: {
          userId: customerId,
          type: 'APPOINTMENT_COMPLETED',
        },
      });
      expect(completedNotif).toBeDefined();
      expect(completedNotif?.entityId).toBe(appointmentId);
      expect(completedNotif?.message).toContain('completed');
    });

    it('Step 6: Customer marks problem NOT solved; generates STAFF_APPOINTMENT_UNSOLVED_FEEDBACK follow-up notification', async () => {
      const withFeedback = await appointmentService.submitAppointmentFeedback(
        appointmentId,
        customerId,
        {
          isProblemSolved: false,
          feedbackNotes: 'Overcharge still appears on my SIM balance statement',
        }
      );

      expect(withFeedback.isProblemSolved).toBe(false);
      expect(withFeedback.followUpStatus).toBe('REQUESTED');

      // Verify staff received unsolved feedback notification
      const staffAlert = await prisma.notification.findFirst({
        where: {
          branchId,
          type: 'STAFF_APPOINTMENT_UNSOLVED_FEEDBACK',
        },
      });
      expect(staffAlert).toBeDefined();
      expect(staffAlert?.entityId).toBe(appointmentId);
      expect(staffAlert?.title).toContain('Problem Not Solved');
    });
  });
});
