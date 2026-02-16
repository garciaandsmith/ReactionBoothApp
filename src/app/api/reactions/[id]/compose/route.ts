import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { composeReaction, checkDependencies } from "@/lib/compose";
import { readFile, mkdir } from "fs/promises";
import { join } from "path";
import type { ReactionEventLog, WatchLayout } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check dependencies first
    const deps = await checkDependencies();
    if (!deps.ffmpeg || !deps.ytdlp) {
      const missing = [];
      if (!deps.ffmpeg) missing.push("ffmpeg");
      if (!deps.ytdlp) missing.push("yt-dlp");
      return NextResponse.json(
        {
          error: `Missing required tools: ${missing.join(", ")}. Install them to enable video compositing.`,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const layout = body.layout as WatchLayout;

    if (!layout || !["pip-desktop", "stacked-mobile"].includes(layout)) {
      return NextResponse.json(
        { error: 'Invalid layout. Use "pip-desktop" or "stacked-mobile".' },
        { status: 400 }
      );
    }

    const reaction = await prisma.reaction.findUnique({
      where: { id: params.id },
      include: { sender: { select: { plan: true } } },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    if (!reaction.recordingUrl || !reaction.eventsUrl) {
      return NextResponse.json(
        { error: "Reaction is missing recording or event data." },
        { status: 400 }
      );
    }

    // Check if already composed with this layout
    if (
      reaction.composedUrl &&
      reaction.composedUrl !== reaction.recordingUrl &&
      reaction.selectedLayout === layout
    ) {
      return NextResponse.json({
        composedUrl: reaction.composedUrl,
        cached: true,
      });
    }

    // Resolve webcam recording path
    let webcamPath: string;
    if (reaction.recordingUrl.startsWith("/api/uploads/")) {
      const relativePath = reaction.recordingUrl.replace("/api/uploads/", "");
      webcamPath = join(process.cwd(), "uploads", relativePath);
    } else {
      return NextResponse.json(
        { error: "Remote recording compositing not yet supported. Use local uploads." },
        { status: 501 }
      );
    }

    // Load events log
    let eventsLog: ReactionEventLog;
    if (reaction.eventsUrl.startsWith("/api/uploads/")) {
      const relativePath = reaction.eventsUrl.replace("/api/uploads/", "");
      const eventsPath = join(process.cwd(), "uploads", relativePath);
      const raw = await readFile(eventsPath, "utf-8");
      eventsLog = JSON.parse(raw);
    } else {
      const res = await fetch(reaction.eventsUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Failed to fetch event log." },
          { status: 500 }
        );
      }
      eventsLog = await res.json();
    }

    // Set up output path
    const outputDir = join(process.cwd(), "uploads", "reactions", reaction.id);
    await mkdir(outputDir, { recursive: true });
    const outputFilename = `composed-${layout}-${Date.now()}.mp4`;
    const outputPath = join(outputDir, outputFilename);
    const composedUrl = `/api/uploads/reactions/${reaction.id}/${outputFilename}`;

    const plan = reaction.sender?.plan ?? "free";

    // Compose
    await composeReaction({
      webcamPath,
      eventsLog,
      layout,
      outputPath,
      watermark: plan === "free",
    });

    // Update reaction with composed URL
    await prisma.reaction.update({
      where: { id: reaction.id },
      data: {
        composedUrl,
        selectedLayout: layout,
      },
    });

    return NextResponse.json({
      composedUrl,
      cached: false,
    });
  } catch (error) {
    console.error("Error compositing reaction:", error);
    const message =
      error instanceof Error ? error.message : "Compositing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
