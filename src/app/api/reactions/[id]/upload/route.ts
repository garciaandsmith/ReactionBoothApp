import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReactionCompleteEmail } from "@/lib/email";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    const uploadDir = path.join(
      process.cwd(),
      process.env.UPLOAD_DIR || "./uploads",
      reaction.id
    );
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `reaction-${Date.now()}.webm`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const relativePath = `/uploads/${reaction.id}/${filename}`;

    const updated = await prisma.reaction.update({
      where: { id: reaction.id },
      data: {
        recordingPath: relativePath,
        composedPath: relativePath, // In production, compose side-by-side here
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
      recordingPath: relativePath,
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
