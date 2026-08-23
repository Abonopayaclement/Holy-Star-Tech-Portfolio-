import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth-guard";

export async function GET() {
  const session = await getAdminSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, message: "Logo is active." });
}
