import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = "unknown";
  let dbError: string | null = null;
  let dbErrorCode: string | null = null;
  let tablesChecked: Record<string, boolean> = {};

  try {
    // 1. Basic connection ping
    await prisma.$queryRaw`SELECT 1 as ping`;
    dbStatus = "connected";

    // 2. Quick check on primary tables
    try {
      await prisma.project.findFirst({ select: { id: true } });
      tablesChecked.project = true;
    } catch {
      tablesChecked.project = false;
    }

    try {
      await prisma.blogPost.findFirst({ select: { id: true } });
      tablesChecked.blogPost = true;
    } catch {
      tablesChecked.blogPost = false;
    }

    try {
      await prisma.user.findFirst({ select: { id: true } });
      tablesChecked.user = true;
    } catch {
      tablesChecked.user = false;
    }
  } catch (error: any) {
    dbStatus = "database_unreachable";
    dbErrorCode = error?.code || null;
    dbError = error?.message ? error.message.split("\n").pop() : "Unknown database error";
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      environment: process.env.NODE_ENV,
      database: {
        status: dbStatus,
        errorCode: dbErrorCode,
        errorMessage: dbError,
        tables: tablesChecked,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
