import * as notificationService from './notificationService';
import * as callbackService from './callbackService';
import * as messageService from './messageService';
import prisma from '../config/prisma';
import {
  NotificationPriority,
  CallbackThreshold,
  CallbackChannel,
  CallbackStatus,
  Role,
  SenderType,
  DeliveryStatus,
} from '@prisma/client';

const userDevicesStore: any[] = [];
const notificationsStore: any[] = [];
const notificationDeliveriesStore: any[] = [];
const callbackRequestsStore: any[] = [];
const conversationsStore: any[] = [];
const messagesStore: any[] = [];

const orgAId = 'org-comm-test-a';
const orgBId = 'org-comm-test-b';
const branchAId = 'branch-comm-test-a';
const branchBId = 'branch-comm-test-b';

const customerAId = 'cust-comm-test-a';
const customerBId = 'cust-comm-test-b';
const staffAId = 'staff-comm-test-a';
const staffBId = 'staff-comm-test-b';

const queueEntryAId = 'entry-comm-test-a';
const queueEntryBId = 'entry-comm-test-b';

const orgA = { id: orgAId, name: 'Telecom Org A', type: 'TELECOM' };
const orgB = { id: orgBId, name: 'Bank Org B', type: 'BANKING' };
const branchA = { id: branchAId, name: 'Bolga Branch A', organizationId: orgAId, organization: orgA };
const branchB = { id: branchBId, name: 'Accra Branch B', organizationId: orgBId, organization: orgB };

const usersMap: Record<string, any> = {
  [customerAId]: { id: customerAId, email: 'alice.comm@test.com', fullName: 'Alice Test', role: 'CUSTOMER' },
  [customerBId]: { id: customerBId, email: 'bob.comm@test.com', fullName: 'Bob Test', role: 'CUSTOMER' },
  [staffAId]: { id: staffAId, email: 'staff.a@test.com', fullName: 'Staff Org A', role: 'STAFF', organizationId: orgAId, staffBranchId: branchAId },
  [staffBId]: { id: staffBId, email: 'staff.b@test.com', fullName: 'Staff Org B', role: 'STAFF', organizationId: orgBId, staffBranchId: branchBId },
};

const entryA = {
  id: queueEntryAId,
  userId: customerAId,
  ticketNumber: 'S-001',
  position: 1,
  queue: {
    id: 'queue-a',
    branchId: branchAId,
    branch: branchA,
    service: { id: 'service-a', name: 'SIM Registration' },
  },
  user: usersMap[customerAId],
};

const entryB = {
  id: queueEntryBId,
  userId: customerBId,
  ticketNumber: 'A-001',
  position: 1,
  queue: {
    id: 'queue-b',
    branchId: branchBId,
    branch: branchB,
    service: { id: 'service-b', name: 'Account Opening' },
  },
  user: usersMap[customerBId],
};

jest.mock('../config/prisma', () => {
  const mockTx = {
    user: {
      findUnique: jest.fn(async ({ where }: any) => usersMap[where.id] || null),
      update: jest.fn(async ({ where, data }: any) => {
        if (usersMap[where.id]) Object.assign(usersMap[where.id], data);
        return usersMap[where.id];
      }),
    },
    userDevice: {
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const key = where.userId_token || {};
        const existing = userDevicesStore.find(
          (d) => d.userId === key.userId && d.token === key.token
        );
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: 'dev-' + Math.random().toString(36).slice(2), ...create };
        userDevicesStore.push(created);
        return created;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const key = where.userId_token || {};
        const idx = userDevicesStore.findIndex(
          (d) => d.userId === key.userId && d.token === key.token
        );
        if (idx !== -1) {
          return userDevicesStore.splice(idx, 1)[0];
        }
        throw new Error('Device not found');
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return userDevicesStore.filter((d) => !where?.userId || d.userId === where.userId);
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    notification: {
      create: jest.fn(async ({ data }: any) => {
        const notif = {
          id: 'notif-' + Math.random().toString(36).slice(2),
          ...data,
          priority: data.priority || 'NORMAL',
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };
        notificationsStore.push(notif);
        return notif;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return notificationsStore.filter((n) => {
          if (where?.userId && n.userId !== where.userId) return false;
          if (where?.type && n.type !== where.type) return false;
          if (where?.isRead !== undefined && n.isRead !== where.isRead) return false;
          return true;
        });
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return notificationsStore.find((n) => {
          if (where?.userId && n.userId !== where.userId) return false;
          if (where?.type && n.type !== where.type) return false;
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
          if (where?.userId && n.userId !== where.userId) return false;
          if (where?.isRead !== undefined && n.isRead !== where.isRead) return false;
          return true;
        }).length;
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    notificationDelivery: {
      create: jest.fn(async ({ data }: any) => {
        const deliv = {
          id: 'deliv-' + Math.random().toString(36).slice(2),
          ...data,
          status: 'SENT',
          sentAt: new Date(),
          createdAt: new Date(),
        };
        notificationDeliveriesStore.push(deliv);
        return deliv;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return notificationDeliveriesStore.filter(
          (d) => !where?.notificationId || d.notificationId === where.notificationId
        );
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    callbackRequest: {
      create: jest.fn(async ({ data }: any) => {
        const cb = {
          id: 'cb-' + Math.random().toString(36).slice(2),
          ...data,
          status: 'ACTIVE',
          createdAt: new Date(),
          queueEntry: data.queueEntryId === queueEntryAId ? entryA : entryB,
        };
        callbackRequestsStore.push(cb);
        return cb;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return callbackRequestsStore.filter((c) => {
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
        return callbackRequestsStore.find((c) => {
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
        return callbackRequestsStore.find((c) => c.id === where.id) || null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const cb = callbackRequestsStore.find((c) => c.id === where.id);
        if (cb) Object.assign(cb, data);
        return cb;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        let count = 0;
        callbackRequestsStore.forEach((c) => {
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
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    conversation: {
      findFirst: jest.fn(async ({ where }: any) => {
        return conversationsStore.find((c) => {
          if (where?.organizationId && c.organizationId !== where.organizationId) return false;
          if (where?.branchId && c.branchId !== where.branchId) return false;
          if (where?.customerId && c.customerId !== where.customerId) return false;
          if (where?.queueEntryId && c.queueEntryId !== where.queueEntryId) return false;
          return true;
        }) || null;
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return conversationsStore.find((c) => c.id === where.id) || null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const conv = {
          id: 'conv-' + Math.random().toString(36).slice(2),
          ...data,
          customer: usersMap[data.customerId],
          staff: data.staffId ? usersMap[data.staffId] : null,
          queueEntry: data.queueEntryId === queueEntryAId ? entryA : entryB,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        conversationsStore.push(conv);
        return conv;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const conv = conversationsStore.find((c) => c.id === where.id);
        if (conv) Object.assign(conv, data);
        return conv;
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    message: {
      create: jest.fn(async ({ data }: any) => {
        const msg = {
          id: 'msg-' + Math.random().toString(36).slice(2),
          ...data,
          sender: usersMap[data.senderId],
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };
        messagesStore.push(msg);
        return msg;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return messagesStore.filter(
          (m) => !where?.conversationId || m.conversationId === where.conversationId
        );
      }),
      count: jest.fn(async ({ where }: any) => {
        return messagesStore.filter((m) => {
          if (where?.conversationId && m.conversationId !== where.conversationId) return false;
          if (where?.senderId && m.senderId !== where.senderId) return false;
          return true;
        }).length;
      }),
      updateMany: jest.fn(async () => ({ count: 1 })),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    queueEntry: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === queueEntryAId) return entryA;
        if (where.id === queueEntryBId) return entryB;
        return null;
      }),
      deleteMany: jest.fn(async () => ({ count: 0 })),
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

describe('Phase 2 — Customer Communication, Callback & Multi-Channel Foundation', () => {
  beforeEach(() => {
    // Clean mock stores
  });

  describe('Part 1, 2, 16 & 17 — Unified Notification, Priorities, Devices & Delivery Tracking', () => {
    it('should register multiple devices per customer and prevent duplicate device tokens', async () => {
      const dev1 = await notificationService.registerUserDevice(customerAId, 'ExponentPushToken[device-alice-phone]', 'IOS');
      const dev2 = await notificationService.registerUserDevice(customerAId, 'ExponentPushToken[device-alice-tablet]', 'ANDROID');

      expect(dev1).toBeDefined();
      expect(dev2).toBeDefined();

      // Registering duplicate token should update rather than create duplicate record
      const dev1Updated = await notificationService.registerUserDevice(customerAId, 'ExponentPushToken[device-alice-phone]', 'IOS');
      expect(dev1Updated?.id).toBe(dev1?.id);

      const allDevices = await notificationService.getUserDevices(customerAId);
      expect(allDevices.length).toBe(2);

      // Clean removal on logout
      await notificationService.removeUserDevice(customerAId, 'ExponentPushToken[device-alice-tablet]');
      const remaining = await notificationService.getUserDevices(customerAId);
      expect(remaining.length).toBe(1);
      expect(remaining[0].token).toBe('ExponentPushToken[device-alice-phone]');
    });

    it('should create unified notification with priority, entityType, and track delivery status', async () => {
      const notif = await notificationService.createNotification({
        userId: customerAId,
        organizationId: orgAId,
        branchId: branchAId,
        type: 'QUEUE_CALLED',
        title: 'Your Turn! 🔔',
        message: 'Ticket S-001 is now being called to Counter 1.',
        priority: 'URGENT',
        entityType: 'QUEUE_ENTRY',
        entityId: queueEntryAId,
      });

      expect(notif).toBeDefined();
      expect(notif.priority).toBe(NotificationPriority.URGENT);
      expect(notif.entityType).toBe('QUEUE_ENTRY');
      expect(notif.entityId).toBe(queueEntryAId);
      expect(notif.isRead).toBe(false);

      // Check delivery tracking records
      const deliveries = await prisma.notificationDelivery.findMany({
        where: { notificationId: notif.id },
      });
      expect(deliveries.length).toBeGreaterThan(0);
      expect(deliveries[0].status).toBe(DeliveryStatus.SENT);
    });

    it('should mark notification as read and record readAt timestamp', async () => {
      const notif = await notificationService.createNotification({
        userId: customerAId,
        organizationId: orgAId,
        branchId: branchAId,
        type: 'QUEUE_JOINED',
        title: 'Queue Joined',
        message: 'You joined SIM Registration',
        priority: 'INFO',
      });

      const updated = await notificationService.markAsRead(notif.id, customerAId);
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('should deduplicate queue milestone notifications', async () => {
      const notif1 = await notificationService.createNotification({
        userId: customerAId,
        organizationId: orgAId,
        branchId: branchAId,
        type: 'QUEUE_MILESTONE_5',
        title: 'Your turn is coming up',
        message: 'You have approximately 5 customers ahead',
        metadata: { ticketId: queueEntryAId, milestone: 5 },
      });
      expect(notif1).toBeDefined();

      const alreadyNotified = await notificationService.hasMilestoneBeenNotified(
        customerAId,
        queueEntryAId,
        'QUEUE_MILESTONE_5'
      );
      expect(alreadyNotified).toBe(true);
    });
  });

  describe('Part 6, 7, 8 & 9 — Callback Request Architecture, Lifecycle & Cancellation', () => {
    it('should register an active callback request', async () => {
      const cb = await callbackService.registerCallbackRequest({
        organizationId: orgAId,
        branchId: branchAId,
        userId: customerAId,
        queueEntryId: queueEntryAId,
        threshold: CallbackThreshold.APPROACHING_5,
        channel: CallbackChannel.IN_APP_NOTIFICATION,
      });

      expect(cb).toBeDefined();
      expect(cb.status).toBe(CallbackStatus.ACTIVE);
      expect(cb.threshold).toBe(CallbackThreshold.APPROACHING_5);

      const active = await callbackService.getActiveCallbackForEntry(queueEntryAId, customerAId);
      expect(active?.id).toBe(cb.id);
    });

    it('should cancel previous callback when customer changes preference (Part 9)', async () => {
      // Customer switches preference to APPROACHING_2
      const newCb = await callbackService.registerCallbackRequest({
        organizationId: orgAId,
        branchId: branchAId,
        userId: customerAId,
        queueEntryId: queueEntryAId,
        threshold: CallbackThreshold.APPROACHING_2,
      });

      expect(newCb.status).toBe(CallbackStatus.ACTIVE);
      expect(newCb.threshold).toBe(CallbackThreshold.APPROACHING_2);

      // Verify old 5-person callback is cancelled
      const oldCbs = await prisma.callbackRequest.findMany({
        where: {
          queueEntryId: queueEntryAId,
          threshold: CallbackThreshold.APPROACHING_5,
        },
      });
      expect(oldCbs.every((c) => c.status === CallbackStatus.CANCELLED)).toBe(true);
    });

    it('should trigger callback when threshold is reached and mark as TRIGGERED', async () => {
      const triggered = await callbackService.evaluateCallbacksForEntry({
        queueEntryId: queueEntryAId,
        peopleAhead: 2,
        isCalled: false,
      });

      expect(triggered.length).toBe(1);
      expect(triggered[0].status).toBe(CallbackStatus.TRIGGERED);
      expect(triggered[0].triggeredAt).toBeDefined();

      // Triggering again should be idempotent and not trigger twice
      const retryTrigger = await callbackService.evaluateCallbacksForEntry({
        queueEntryId: queueEntryAId,
        peopleAhead: 1,
        isCalled: false,
      });
      expect(retryTrigger.length).toBe(0);
    });

    it('should acknowledge triggered callback when opened by customer', async () => {
      const active = await callbackService.getActiveCallbackForEntry(queueEntryAId, customerAId);
      expect(active?.status).toBe(CallbackStatus.TRIGGERED);

      const ack = await callbackService.acknowledgeCallback(active!.id, customerAId);
      expect(ack.status).toBe(CallbackStatus.ACKNOWLEDGED);
      expect(ack.acknowledgedAt).toBeDefined();
    });
  });

  describe('Part 10, 11, 12 & 31 — Staff-Customer Messaging, Security & Rate Limiting', () => {
    let conversationId: string;

    it('should create a scoped conversation associated with organization, branch and queue ticket', async () => {
      const conv = await messageService.getOrCreateConversation({
        userId: customerAId,
        role: Role.CUSTOMER,
        queueEntryId: queueEntryAId,
      });

      expect(conv).toBeDefined();
      expect(conv.organizationId).toBe(orgAId);
      expect(conv.branchId).toBe(branchAId);
      expect(conv.customerId).toBe(customerAId);
      expect(conv.queueEntryId).toBe(queueEntryAId);

      conversationId = conv.id;
    });

    it('should exchange messages between staff and customer in the same branch', async () => {
      // Staff sends instruction
      const staffMsg = await messageService.sendMessage({
        conversationId,
        senderId: staffAId,
        senderRole: Role.STAFF,
        message: 'Please have your Ghana Card ready.',
      });
      expect(staffMsg.message).toBe('Please have your Ghana Card ready.');
      expect(staffMsg.senderType).toBe(SenderType.STAFF);

      // Customer replies
      const custMsg = await messageService.sendMessage({
        conversationId,
        senderId: customerAId,
        senderRole: Role.CUSTOMER,
        message: 'Okay, I have it with me.',
      });
      expect(custMsg.message).toBe('Okay, I have it with me.');
      expect(custMsg.senderType).toBe(SenderType.CUSTOMER);

      const messages = await messageService.getConversationMessages(conversationId, customerAId, Role.CUSTOMER);
      expect(messages.length).toBe(2);
    });

    it('should enforce strict multi-tenant security: Customer B cannot read or send messages in Customer A conversation', async () => {
      await expect(
        messageService.getConversationMessages(conversationId, customerBId, Role.CUSTOMER)
      ).rejects.toThrow(/Forbidden/);

      await expect(
        messageService.sendMessage({
          conversationId,
          senderId: customerBId,
          senderRole: Role.CUSTOMER,
          message: 'Trying to snoop',
        })
      ).rejects.toThrow(/Forbidden/);
    });

    it('should enforce strict cross-tenant security: Organization B staff cannot view or message Organization A conversations', async () => {
      await expect(
        messageService.getConversationMessages(conversationId, staffBId, Role.STAFF)
      ).rejects.toThrow(/Forbidden/);

      await expect(
        messageService.sendMessage({
          conversationId,
          senderId: staffBId,
          senderRole: Role.STAFF,
          message: 'Unauthorized cross-org staff message',
        })
      ).rejects.toThrow(/Forbidden/);
    });

    it('should enforce rate limiting protection against message flooding', async () => {
      // Sending > 15 messages within 1 minute from the same sender should trigger rate limiting
      let rateLimitTriggered = false;
      try {
        for (let i = 0; i < 20; i++) {
          await messageService.sendMessage({
            conversationId,
            senderId: customerAId,
            senderRole: Role.CUSTOMER,
            message: `Flood test message #${i}`,
          });
        }
      } catch (err: any) {
        if (err.message.includes('Rate limit exceeded')) {
          rateLimitTriggered = true;
        }
      }
      expect(rateLimitTriggered).toBe(true);
    });
  });
});
