"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function generateId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

async function ensureNotificationTableExist() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`notification\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`message\` VARCHAR(191) NOT NULL,
        \`type\` VARCHAR(191) NOT NULL DEFAULT 'COMMENT',
        \`targetUrl\` VARCHAR(191) NULL,
        \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn("Notification table auto-creation warning:", err);
  }
}

export async function createNotification(
  title: string,
  message: string,
  type: "COMMENT" | "LIKE" | "CONTACT" | "SYSTEM" = "COMMENT",
  targetUrl: string = "/private"
) {
  try {
    await ensureNotificationTableExist();
    const p = prisma as any;
    if (p.notification) {
      await p.notification.create({
        data: { title, message, type, targetUrl, isRead: false },
      });
    } else {
      const id = generateId("notif");
      await prisma.$executeRaw`
        INSERT INTO \`notification\` (id, title, message, type, targetUrl, isRead, createdAt)
        VALUES (${id}, ${title}, ${message}, ${type}, ${targetUrl}, false, NOW())
      `;
    }
    revalidatePath("/private");
    revalidatePath("/private/notifications");
    return { success: true };
  } catch (err) {
    console.error("Failed to create notification:", err);
    return { success: false };
  }
}

export async function getDashboardNotifications() {
  try {
    await ensureNotificationTableExist();
    let notifications: any[] = [];
    let unreadCount = 0;
    const p = prisma as any;

    try {
      if (p.notification) {
        notifications = await p.notification.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        unreadCount = await p.notification.count({
          where: { isRead: false },
        });
      } else {
        notifications = await prisma.$queryRaw`
          SELECT id, title, message, type, targetUrl, isRead, createdAt FROM \`notification\`
          ORDER BY createdAt DESC LIMIT 20
        `;
        const res: any[] = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM \`notification\` WHERE isRead = false
        `;
        unreadCount = Number(res[0]?.count || 0);
      }
    } catch (dbErr) {
      console.warn("Notifications DB query fallback:", dbErr);
    }

    return {
      unreadCount,
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || "COMMENT",
        targetUrl: n.targetUrl || "/private",
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard notifications:", error);
    return { unreadCount: 0, notifications: [] };
  }
}

export async function getAllNotificationsAdmin(filter: "ALL" | "UNREAD" | "READ" = "ALL") {
  try {
    await ensureNotificationTableExist();
    let notifications: any[] = [];
    let unreadCount = 0;
    let totalCount = 0;
    const p = prisma as any;

    if (p.notification) {
      totalCount = await p.notification.count();
      unreadCount = await p.notification.count({ where: { isRead: false } });

      const whereClause: any = {};
      if (filter === "UNREAD") whereClause.isRead = false;
      if (filter === "READ") whereClause.isRead = true;

      notifications = await p.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
    } else {
      const totRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`notification\``;
      totalCount = Number(totRes[0]?.count || 0);

      const unrRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`notification\` WHERE isRead = false`;
      unreadCount = Number(unrRes[0]?.count || 0);

      if (filter === "UNREAD") {
        notifications = await prisma.$queryRaw`
          SELECT id, title, message, type, targetUrl, isRead, createdAt FROM \`notification\`
          WHERE isRead = false ORDER BY createdAt DESC
        `;
      } else if (filter === "READ") {
        notifications = await prisma.$queryRaw`
          SELECT id, title, message, type, targetUrl, isRead, createdAt FROM \`notification\`
          WHERE isRead = true ORDER BY createdAt DESC
        `;
      } else {
        notifications = await prisma.$queryRaw`
          SELECT id, title, message, type, targetUrl, isRead, createdAt FROM \`notification\`
          ORDER BY createdAt DESC
        `;
      }
    }

    return {
      totalCount,
      unreadCount,
      readCount: totalCount - unreadCount,
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || "COMMENT",
        targetUrl: n.targetUrl || "/private",
        isRead: Boolean(n.isRead),
        createdAt: n.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch all notifications:", error);
    return { totalCount: 0, unreadCount: 0, readCount: 0, notifications: [] };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await ensureNotificationTableExist();
    const p = prisma as any;
    if (p.notification) {
      await p.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } else {
      await prisma.$executeRaw`
        UPDATE \`notification\` SET isRead = true WHERE id = ${id}
      `;
    }

    revalidatePath("/private");
    revalidatePath("/private/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    await ensureNotificationTableExist();
    const p = prisma as any;
    if (p.notification) {
      await p.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    } else {
      await prisma.$executeRaw`
        UPDATE \`notification\` SET isRead = true WHERE isRead = false
      `;
    }

    revalidatePath("/private");
    revalidatePath("/private/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false };
  }
}

export async function deleteNotification(id: string) {
  try {
    await ensureNotificationTableExist();
    const p = prisma as any;
    if (p.notification) {
      await p.notification.delete({ where: { id } });
    } else {
      await prisma.$executeRaw`
        DELETE FROM \`notification\` WHERE id = ${id}
      `;
    }

    revalidatePath("/private");
    revalidatePath("/private/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return { success: false };
  }
}

export async function clearAllNotifications() {
  try {
    await ensureNotificationTableExist();
    const p = prisma as any;
    if (p.notification) {
      await p.notification.deleteMany({});
    } else {
      await prisma.$executeRaw`DELETE FROM \`notification\``;
    }

    revalidatePath("/private");
    revalidatePath("/private/notifications");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    return { success: false };
  }
}
