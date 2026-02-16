import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: { id: params.id },
      include: { sender: { select: { plan: true } } },
    });

    if (!reaction || !reaction.recordingUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plan = reaction.sender?.plan ?? "free";

    // Check burn-after-use for free plan
    if (plan === "free" && reaction.downloadCount >= 1) {
      return NextResponse.json(
        {
          error:
            "Download link has already been used. Upgrade to Pro for unlimited downloads.",
        },
        { status: 403 }
      );
    }

    // Increment download count
    await prisma.reaction.update({
      where: { id: reaction.id },
      data: { downloadCount: { increment: 1 } },
    });

    // For now, redirect to the webcam recording
    // Phase 2: redirect to composedUrl once server-side compositing is built
    const downloadUrl = reaction.composedUrl || reaction.recordingUrl;

    // For local file URLs, resolve to full URL
    if (downloadUrl.startsWith("/")) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}${downloadUrl}`);
    }

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Error processing download:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}
