import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(
      process.cwd(),
      process.env.UPLOAD_DIR || "./uploads",
      ...params.path
    );

    // Prevent directory traversal
    const resolved = path.resolve(filePath);
    const uploadsDir = path.resolve(
      path.join(process.cwd(), process.env.UPLOAD_DIR || "./uploads")
    );
    if (!resolved.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".webm": "video/webm",
      ".mp4": "video/mp4",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
