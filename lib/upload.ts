import { promises as fs } from "fs";
import path from "path";

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

export type AllowedFileType = "image" | "pdf";

const ALLOWED_MIME_TYPES: Record<AllowedFileType, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
  pdf: ["application/pdf"],
};

export async function uploadFile(
  file: File,
  type: AllowedFileType
): Promise<UploadResult> {
  try {
    const allowedTypes = ALLOWED_MIME_TYPES[type];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file format for ${type}. Allowed: ${allowedTypes.join(", ")}`,
      };
    }

    // 10MB limit for images & PDF
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        success: false,
        error: `File size exceeds limit (${maxBytes / (1024 * 1024)}MB max).`,
      };
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedName}`;

    // Target upload subfolder
    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${type}/${fileName}`;

    return {
      success: true,
      fileUrl,
      fileName,
    };
  } catch (error) {
    console.error("File upload failure:", error);
    return {
      success: false,
      error: "An unexpected error occurred during file upload.",
    };
  }
}
