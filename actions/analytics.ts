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

function generateId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

async function ensureVisitorLogTableExist() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`VisitorLog\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`visitorId\` VARCHAR(191) NOT NULL,
        \`path\` VARCHAR(191) NOT NULL,
        \`device\` VARCHAR(191) NULL,
        \`browser\` VARCHAR(191) NULL,
        \`os\` VARCHAR(191) NULL,
        \`referrer\` VARCHAR(191) NULL,
        \`ipAddress\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`VisitorLog_createdAt_idx\` (\`createdAt\`),
        INDEX \`VisitorLog_visitorId_idx\` (\`visitorId\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn("VisitorLog table auto-creation warning:", err);
  }
}

export async function recordVisitorEvent(payload: VisitPayload) {
  try {
    if (!payload.path || payload.path.startsWith("/private") || payload.path.startsWith("/api")) {
      return { success: true, ignored: true };
    }

    await ensureVisitorLogTableExist();
    const maskedIp = maskIp(payload.ipAddress);
    const p = prisma as any;

    try {
      if (p.visitorLog) {
        await p.visitorLog.create({
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
      } else {
        const vid = generateId("vlog");
        await prisma.$executeRaw`
          INSERT INTO \`VisitorLog\` (id, visitorId, path, device, browser, os, referrer, ipAddress, createdAt)
          VALUES (${vid}, ${payload.visitorId || "anon_visitor"}, ${payload.path.slice(0, 255)}, ${payload.device || "Desktop"}, ${payload.browser || "Chrome"}, ${payload.os || "Windows"}, ${payload.referrer ? payload.referrer.slice(0, 255) : "Direct"}, ${maskedIp}, NOW())
        `;
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
    await ensureVisitorLogTableExist();
    const p = prisma as any;
    if (p.visitorLog) {
      await p.visitorLog.deleteMany({});
    } else {
      await prisma.$executeRaw`DELETE FROM \`VisitorLog\``;
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
      } else {
        throw new Error("Prisma visitorLog model not mounted, using raw SQL");
      }
    } catch (e) {
      // BULLETPROOF RAW SQL FALLBACK FOR VISITOR ANALYTICS
      try {
        await ensureVisitorLogTableExist();
        const totalRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`VisitorLog\``;
        totalVisitors = Number(totalRes[0]?.count || 0);

        const todayRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`VisitorLog\` WHERE createdAt >= ${startOfToday}`;
        todayVisitors = Number(todayRes[0]?.count || 0);

        const weekRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`VisitorLog\` WHERE createdAt >= ${startOfWeek}`;
        weekVisitors = Number(weekRes[0]?.count || 0);

        const monthRes: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`VisitorLog\` WHERE createdAt >= ${startOfMonth}`;
        monthVisitors = Number(monthRes[0]?.count || 0);

        const uniqRes: any[] = await prisma.$queryRaw`SELECT COUNT(DISTINCT visitorId) as count FROM \`VisitorLog\``;
        uniqueVisitors = Number(uniqRes[0]?.count || 0);

        recentLogs = await prisma.$queryRaw`
          SELECT id, visitorId, path, device, browser, os, referrer, createdAt FROM \`VisitorLog\`
          ORDER BY createdAt DESC LIMIT 50
        `;
      } catch (rawErr) {
        console.warn("Analytics DB query fallback error:", rawErr);
      }
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
