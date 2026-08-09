"use server";

import { prisma } from "@/lib/prisma";

export interface VisitPayload {
  visitorId: string;
  path: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  ipAddress?: string;
}

// Anonymize IP address (e.g. 192.168.1.50 -> 192.168.x.x)
function maskIp(ip?: string): string {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "unknown") return "127.0.0.x";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  return "xxx.xxx.x.x";
}

export async function recordVisitorEvent(payload: VisitPayload) {
  try {
    if (!payload.path || payload.path.startsWith("/private") || payload.path.startsWith("/api")) {
      return { success: true, ignored: true };
    }

    const maskedIp = maskIp(payload.ipAddress);

    // Save to VisitorLog table using raw try/catch for database safety
    try {
      if ((prisma as any).visitorLog) {
        await (prisma as any).visitorLog.create({
          data: {
            visitorId: payload.visitorId || "anon_visitor",
            path: payload.path.slice(0, 255),
            device: payload.device || "Desktop",
            browser: payload.browser || "Chrome",
            os: payload.os || "Windows",
            referrer: payload.referrer ? payload.referrer.slice(0, 255) : "Direct",
            ipAddress: maskedIp,
          },
        });
      }
    } catch (dbErr) {
      console.warn("Visitor log DB insertion fallback:", dbErr);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to record visitor analytics:", error);
    return { success: false };
  }
}

export async function clearVisitorLogs() {
  try {
    if ((prisma as any).visitorLog) {
      await (prisma as any).visitorLog.deleteMany({});
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to clear visitor logs:", error);
    return { success: true };
  }
}

export async function getVisitorAnalytics() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalVisitors = 0;
    let todayVisitors = 0;
    let weekVisitors = 0;
    let monthVisitors = 0;
    let uniqueVisitors = 0;
    let recentLogs: any[] = [];
    let topPagesMap: Record<string, number> = {};
    let deviceMap: Record<string, number> = {};

    try {
      if ((prisma as any).visitorLog) {
        totalVisitors = await (prisma as any).visitorLog.count();
        todayVisitors = await (prisma as any).visitorLog.count({
          where: { createdAt: { gte: startOfToday } },
        });
        weekVisitors = await (prisma as any).visitorLog.count({
          where: { createdAt: { gte: startOfWeek } },
        });
        monthVisitors = await (prisma as any).visitorLog.count({
          where: { createdAt: { gte: startOfMonth } },
        });

        // Unique visitors count
        const uniqueResult = await (prisma as any).visitorLog.groupBy({
          by: ["visitorId"],
          _count: true,
        });
        uniqueVisitors = uniqueResult.length;

        // Recent 50 visits
        recentLogs = await (prisma as any).visitorLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        // Group by pages
        const pageGroups = await (prisma as any).visitorLog.groupBy({
          by: ["path"],
          _count: { path: true },
          orderBy: { _count: { path: "desc" } },
          take: 5,
        });
        pageGroups.forEach((g: any) => {
          topPagesMap[g.path] = g._count.path;
        });

        // Group by devices
        const deviceGroups = await (prisma as any).visitorLog.groupBy({
          by: ["device"],
          _count: { device: true },
        });
        deviceGroups.forEach((g: any) => {
          deviceMap[g.device || "Desktop"] = g._count.device;
        });
      }
    } catch (e) {
      console.warn("Analytics DB query fallback:", e);
    }

    const mostViewedPage = Object.keys(topPagesMap)[0] || "/";

    return {
      totalVisitors,
      todayVisitors,
      weekVisitors,
      monthVisitors,
      uniqueVisitors,
      mostViewedPage,
      topPagesMap,
      deviceMap,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt,
        path: log.path,
        device: log.device || "Desktop",
        browser: log.browser || "Chrome",
        os: log.os || "Windows",
        referrer: log.referrer || "Direct",
        visitorId: log.visitorId || "anon",
      })),
    };
  } catch (error) {
    console.error("Failed to load visitor analytics:", error);
    return {
      totalVisitors: 0,
      todayVisitors: 0,
      weekVisitors: 0,
      monthVisitors: 0,
      uniqueVisitors: 0,
      mostViewedPage: "/",
      topPagesMap: {},
      deviceMap: {},
      recentLogs: [],
    };
  }
}
