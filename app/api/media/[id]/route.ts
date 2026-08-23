import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("Asset ID is required", { status: 400 });
    }

    // Clean extension if present in the URL (e.g. /api/media/cm12345.png -> cm12345)
    const cleanId = id.split(".")[0];

    const asset = await (prisma as any).mediaAsset.findUnique({
      where: { id: cleanId },
    });

    if (!asset) {
      return new NextResponse("Media asset not found", { status: 404 });
    }

    // Decode base64 data to binary buffer
    const buffer = Buffer.from(asset.data, "base64");
    const fileSize = buffer.length;
    const mimeType = asset.mimeType || "application/octet-stream";

    // Handle HTTP Range Requests (Essential for Video streaming & Safari/iOS playback)
    const range = request.headers.get("range");

    if (range && mimeType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunk = buffer.subarray(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunk.length.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Media serving error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
