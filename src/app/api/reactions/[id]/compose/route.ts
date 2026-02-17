import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { composeReaction, checkDependencies } from "@/lib/compose";
import { readFile, mkdir } from "fs/promises";
import { join } from "path";
import { ALL_LAYOUTS } from "@/lib/constants";
import type { ReactionEventLog, WatchLayout, ComposeVolumeSettings } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const volume: ComposeVolumeSettings = {
      youtubeVolume: Math.max(0, Math.min(200, body.youtubeVolume ?? 100)),
      webcamVolume: Math.max(0, Math.min(200, body.webcamVolume ?? 100)),
    };

    if (!layout || !ALL_LAYOUTS.includes(layout)) {
      return NextResponse.json(
        { error: `Invalid layout. Use one of: ${ALL_LAYOUTS.join(", ")}` },
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

    let webcamPath: string;
    if (reaction.recordingUrl.startsWith("/api/uploads/")) {
      const relativePath = reaction.recordingUrl.replace("/api/uploads/", "");
      webcamPath = join(process.cwd(), "uploads", relativePath);
    } else {
      return NextResponse.json(
        { error: "Recording path not recognized." },
        { status: 400 }
      );
    }

    let eventsLog: ReactionEventLog;
    if (reaction.eventsUrl.startsWith("/api/uploads/")) {
      const relativePath = reaction.eventsUrl.replace("/api/uploads/", "");
      const eventsPath = join(process.cwd(), "uploads", relativePath);
      const raw = await readFile(eventsPath, "utf-8");
      eventsLog = JSON.parse(raw);
    } else {
      return NextResponse.json(
        { error: "Events path not recognized." },
        { status: 400 }
      );
    }

    const outputDir = join(process.cwd(), "uploads", "reactions", reaction.id);
    await mkdir(outputDir, { recursive: true });
    const outputFilename = `composed-${layout}-${Date.now()}.mp4`;
    const outputPath = join(outputDir, outputFilename);
    const composedUrl = `/api/uploads/reactions/${reaction.id}/${outputFilename}`;

    const plan = reaction.sender?.plan ?? "free";

    await composeReaction({
      webcamPath,
      eventsLog,
      layout,
      outputPath,
      watermark: plan === "free",
      volume,
    });

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
