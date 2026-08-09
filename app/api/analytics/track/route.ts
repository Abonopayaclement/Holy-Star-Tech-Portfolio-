import { NextRequest, NextResponse } from "next/server";
import { recordVisitorEvent } from "@/actions/analytics";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      const text = await req.text();
      body = JSON.parse(text || "{}");
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    await recordVisitorEvent({
      visitorId: body.visitorId || "anon",
      path: body.path || "/",
      device: body.device || "Desktop",
      browser: body.browser || "Chrome",
      os: body.os || "Windows",
      referrer: body.referrer || "Direct",
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
