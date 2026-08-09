"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDashboardNotifications() {
  try {
    let notifications: any[] = [];
    let unreadCount = 0;

    try {
      if ((prisma as any).notification) {
        notifications = await (prisma as any).notification.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        unreadCount = await (prisma as any).notification.count({
          where: { isRead: false },
        });
      }
    } catch (dbErr) {
      console.warn("Notifications DB query fallback:", dbErr);
    }

    return {
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || "COMMENT",
        targetUrl: n.targetUrl || "/private",
        isRead: n.isRead || false,
        createdAt: n.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard notifications:", error);
    return { unreadCount: 0, notifications: [] };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    if ((prisma as any).notification) {
      await (prisma as any).notification.update({
        where: { id },
        data: { isRead: true },
      });
    }

    revalidatePath("/private");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    if ((prisma as any).notification) {
      await (prisma as any).notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
    }

    revalidatePath("/private");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false };
  }
}
