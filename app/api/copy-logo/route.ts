import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const src = "C:\\Users\\abono\\.gemini\\antigravity-ide\\brain\\94753cd5-cbda-488d-bed1-e0125ba7986d\\media__1786038593326.jpg";
    const publicDir = path.join(process.cwd(), "public");
    const appDir = path.join(process.cwd(), "app");

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.copyFileSync(src, path.join(publicDir, "logo.png"));
    fs.copyFileSync(src, path.join(publicDir, "favicon.ico"));

    const duplicateAppFavicon = path.join(appDir, "favicon.ico");
    if (fs.existsSync(duplicateAppFavicon)) {
      fs.unlinkSync(duplicateAppFavicon);
    }

    return NextResponse.json({ success: true, message: "HST Logo copied to public/logo.png and public/favicon.ico!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to copy logo." }, { status: 500 });
  }
}
