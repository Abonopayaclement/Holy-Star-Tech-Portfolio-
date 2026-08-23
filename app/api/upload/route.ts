import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/auth-guard";

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
        { success: false, error: "No file provided." },
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
    const isApk =
      fileNameLower.endsWith(".apk") ||
      file.type === "application/vnd.android.package-archive" ||
      file.type === "application/octet-stream";

    if (!isPdf && !isImage && !isApk) {
      return NextResponse.json(
        {
          success: false,
          error: "Only PDF documents, images, and APK files are supported.",
        },
        { status: 400 }
      );
    }

    let subDir = "images";
    let fileCategory = "image";

    if (isPdf) {
      subDir = "cv";
      fileCategory = "pdf";
    } else if (isApk) {
      subDir = "apk";
      fileCategory = "apk";
    } else {
      subDir = "images";
      fileCategory = "image";
    }

    let publicUrl: string;

    // Clean filename
    const ext =
      path.extname(file.name) ||
      (isPdf ? ".pdf" : isApk ? ".apk" : ".png");
    const nameWithoutExt = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueFileName = `${subDir}_${Date.now()}_${nameWithoutExt}${ext}`;

    try {
      // Attempt local filesystem write (works in local dev environment)
      const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFileName);
      await writeFile(filePath, buffer);
      publicUrl = `/uploads/${subDir}/${uniqueFileName}`;
    } catch (fsErr: any) {
      // If filesystem is read-only (e.g. Vercel Serverless runtime / EROFS)
      // Fall back seamlessly to a Base64 data URL
      const mimeType = isPdf
        ? "application/pdf"
        : isApk
        ? "application/vnd.android.package-archive"
        : file.type || "image/png";
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
      { success: false, error: error instanceof Error ? error.message : "Failed to upload file." },
      { status: 500 }
    );
  }
}
