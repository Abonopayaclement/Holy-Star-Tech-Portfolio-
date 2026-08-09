import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Holy Star Tech API",
    status: "Operational",
    version: "1.0.0",
    author: "Abonopaya Clement Ayebono",
    timestamp: new Date().toISOString(),
  });
}
