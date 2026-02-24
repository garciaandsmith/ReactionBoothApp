import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "backgrounds");
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
]);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const layout = formData.get("layout") as string | null;

    if (!file || !layout) {
      return NextResponse.json({ error: "File and layout are required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV." },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop() || "bin";
    const filename = `bg-${layout}-${Date.now()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const url = `/api/uploads/backgrounds/${filename}`;

    // Store in SiteSettings as `default_bg_{layout}`
    const key = `default_bg_${layout}`;
    await prisma.siteSettings.upsert({
      where: { key },
      update: { value: JSON.stringify({ url, type: file.type }) },
      create: { key, value: JSON.stringify({ url, type: file.type }) },
    });

    return NextResponse.json({ url, type: file.type, layout });
  } catch (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
