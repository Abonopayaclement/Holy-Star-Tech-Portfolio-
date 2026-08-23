import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided for upload." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileNameLower = file.name.toLowerCase();
    const isPdf =
      fileNameLower.endsWith(".pdf") ||
      file.type === "application/pdf" ||
      file.type === "application/x-pdf" ||
      file.type === "application/acrobat";
    const isImage = file.type.startsWith("image/");
    const isVideo =
      file.type.startsWith("video/") ||
      fileNameLower.endsWith(".mp4") ||
      fileNameLower.endsWith(".webm") ||
      fileNameLower.endsWith(".mov") ||
      fileNameLower.endsWith(".mkv");
    const isApk =
      fileNameLower.endsWith(".apk") ||
      file.type === "application/vnd.android.package-archive" ||
      file.type === "application/octet-stream";

    if (!isPdf && !isImage && !isVideo && !isApk) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Please upload images, videos (MP4/WebM/MOV), PDFs, or APKs.",
        },
        { status: 400 }
      );
    }

    let subDir = "images";
    let fileCategory = "image";

    if (isPdf) {
      subDir = "cv";
      fileCategory = "pdf";
    } else if (isVideo) {
      subDir = "videos";
      fileCategory = "video";
    } else if (isApk) {
      subDir = "apk";
      fileCategory = "apk";
    } else {
      subDir = "images";
      fileCategory = "image";
    }

    const ext =
      path.extname(file.name) ||
      (isPdf ? ".pdf" : isVideo ? ".mp4" : isApk ? ".apk" : ".png");

    let publicUrl: string;

    try {
      // 1. Primary permanent storage: Save to Aiven MySQL MediaAsset table
      const asset = await (prisma as any).mediaAsset.create({
        data: {
          filename: file.name,
          mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
          size: file.size,
          data: buffer.toString("base64"),
        },
      });

      publicUrl = `/api/media/${asset.id}${ext}`;

      // 2. Secondary fast mirror in local development environment
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
        await mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, `${subDir}_${asset.id}${ext}`);
        await writeFile(filePath, buffer);
      } catch {
        // Local filesystem not available (e.g. Vercel read-only runtime) - Aiven media endpoint serves it
      }
    } catch (dbErr) {
      console.warn("Database media storage fallback:", dbErr);
      // Fallback to data URL or local disk if database table not yet initialized
      const mimeType = isPdf
        ? "application/pdf"
        : isVideo
        ? "video/mp4"
        : isApk
        ? "application/vnd.android.package-archive"
        : file.type || "image/jpeg";
      publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileType: fileCategory,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process and save uploaded file.",
      },
      { status: 500 }
    );
  }
}
