import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), "uploads", ...params.path);
    const data = await readFile(filePath);

    const ext = params.path[params.path.length - 1]?.split(".").pop() || "";
    const contentTypes: Record<string, string> = {
      webm: "video/webm",
      mp4: "video/mp4",
      mov: "video/quicktime",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      json: "application/json",
    };

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
