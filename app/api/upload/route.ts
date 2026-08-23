import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function ensureMediaAssetTableExists() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`media_asset\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`filename\` VARCHAR(191) NOT NULL,
        \`mimeType\` VARCHAR(191) NOT NULL,
        \`size\` INT NOT NULL,
        \`data\` LONGTEXT NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  } catch (err) {
    // Ignore if already exists
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Administrator access required." },
        { status: 401 }
      );
    }

    await ensureMediaAssetTableExists();

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

    const assetId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mimeType = isPdf
      ? "application/pdf"
      : isVideo
      ? (file.type || "video/mp4")
      : isApk
      ? "application/vnd.android.package-archive"
      : (file.type || "image/jpeg");

    const base64Data = buffer.toString("base64");

    // 1. Primary permanent storage: Save to Aiven MySQL MediaAsset table
    try {
      try {
        await (prisma as any).mediaAsset.create({
          data: {
            id: assetId,
            filename: file.name,
            mimeType,
            size: file.size,
            data: base64Data,
          },
        });
      } catch {
        await prisma.$executeRawUnsafe(
          "INSERT INTO `media_asset` (`id`, `filename`, `mimeType`, `size`, `data`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))",
          assetId,
          file.name,
          mimeType,
          file.size,
          base64Data
        );
      }
    } catch (dbErr) {
      console.warn("Database media storage warning:", dbErr);
    }

    // 2. Secondary local file mirror for local dev
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, `${subDir}_${assetId}${ext}`);
      await writeFile(filePath, buffer);
    } catch {
      // Read-only filesystem in cloud runtime (Vercel) is normal
    }

    // Always return clean, minimized /api/media/ URL
    const publicUrl = `/api/media/${assetId}${ext}`;

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
