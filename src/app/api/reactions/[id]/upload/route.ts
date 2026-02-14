import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReactionCompleteEmail } from "@/lib/email";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function saveLocally(filename: string, file: File): Promise<string> {
  const parts = filename.split("/");
  const dir = join(process.cwd(), "uploads", ...parts.slice(0, -1));
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(process.cwd(), "uploads", filename), buffer);
  return `/api/uploads/${filename}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: { id: params.id },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("recording") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No recording file provided" },
        { status: 400 }
      );
    }

    const filename = `reactions/${reaction.id}/reaction-${Date.now()}.webm`;

    let recordingUrl: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Use Vercel Blob for production
      const { put } = await import("@vercel/blob");
      const blob = await put(filename, file, {
        access: "public",
        contentType: file.type || "video/webm",
      });
      recordingUrl = blob.url;
    } else {
      // Fall back to local filesystem
      recordingUrl = await saveLocally(filename, file);
    }

    const updated = await prisma.reaction.update({
      where: { id: reaction.id },
      data: {
        recordingUrl,
        composedUrl: recordingUrl,
        status: "completed",
        completedAt: new Date(),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const watchUrl = `${appUrl}/watch/${reaction.id}`;

    // Send completion emails (non-blocking)
    sendReactionCompleteEmail(reaction.senderEmail, watchUrl, true).catch(
      (err) => console.error("Failed to send sender email:", err)
    );
    sendReactionCompleteEmail(reaction.recipientEmail, watchUrl, false).catch(
      (err) => console.error("Failed to send recipient email:", err)
    );

    return NextResponse.json({
      id: updated.id,
      recordingUrl,
      watchUrl,
    });
  } catch (error) {
    console.error("Error uploading recording:", error);
    return NextResponse.json(
      { error: "Failed to upload recording" },
      { status: 500 }
    );
  }
}
