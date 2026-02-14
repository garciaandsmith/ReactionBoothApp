import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReactionCompleteEmail } from "@/lib/email";
import { put } from "@vercel/blob";

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

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type || "video/webm",
    });

    const updated = await prisma.reaction.update({
      where: { id: reaction.id },
      data: {
        recordingUrl: blob.url,
        composedUrl: blob.url,
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
      recordingUrl: blob.url,
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
