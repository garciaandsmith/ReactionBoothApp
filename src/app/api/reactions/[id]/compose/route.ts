import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { composeReaction } from "@/lib/compose";
import { mkdtemp, rm, readFile } from "fs/promises";
import { createWriteStream } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { put } from "@vercel/blob";
import { ALL_LAYOUTS } from "@/lib/constants";
import type { ReactionEventLog, WatchLayout, ComposeVolumeSettings } from "@/lib/types";

// Allow up to 5 minutes — compositing a video with ffmpeg takes time.
export const maxDuration = 300;

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const writeStream = createWriteStream(filePath);
  await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), writeStream);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let tempDir: string | null = null;

  try {
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
      return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
    }

    if (!reaction.recordingUrl || !reaction.eventsUrl) {
      return NextResponse.json(
        { error: "Reaction is missing recording or event data." },
        { status: 400 }
      );
    }

    // Fetch the event log (supports legacy local paths and Vercel Blob HTTPS URLs)
    let eventsLog: ReactionEventLog;
    if (reaction.eventsUrl.startsWith("https://")) {
      const res = await fetch(reaction.eventsUrl);
      if (!res.ok) throw new Error("Failed to load event log from Blob storage.");
      eventsLog = await res.json();
    } else {
      // Legacy: local /api/uploads/ path
      const relativePath = reaction.eventsUrl.replace("/api/uploads/", "");
      const raw = await readFile(join(process.cwd(), "uploads", relativePath), "utf-8");
      eventsLog = JSON.parse(raw);
    }

    tempDir = await mkdtemp(join(tmpdir(), "reactionbooth-"));
    const webcamPath = join(tempDir, "webcam.webm");
    const outputPath = join(tempDir, `composed-${layout}.mp4`);

    // Download the webcam recording (Vercel Blob or legacy local path)
    if (reaction.recordingUrl.startsWith("https://")) {
      await downloadToFile(reaction.recordingUrl, webcamPath);
    } else {
      const relativePath = reaction.recordingUrl.replace("/api/uploads/", "");
      const localPath = join(process.cwd(), "uploads", relativePath);
      // Copy from local path — just pass localPath directly to composeReaction
      const { copyFile } = await import("fs/promises");
      await copyFile(localPath, webcamPath);
    }

    const plan = reaction.sender?.plan ?? "free";

    // Load YouTube cookies from the admin DB setting; fall back to env var.
    // The cookies are forwarded to yt-dlp to authenticate requests that
    // YouTube bot-guards when originating from datacenter IPs.
    const cookiesSetting = await prisma.siteSettings.findUnique({
      where: { key: "youtube_cookies" },
    });
    const cookiesContent = cookiesSetting?.value ?? process.env.YOUTUBE_COOKIES;

    await composeReaction({
      webcamPath,
      eventsLog,
      layout,
      outputPath,
      watermark: plan === "free",
      volume,
      cookiesContent,
    });

    // Upload the composed MP4 to Vercel Blob
    const outputBuffer = await readFile(outputPath);
    const composedBlob = await put(
      `reactions/${params.id}/composed-${layout}-${Date.now()}.mp4`,
      outputBuffer,
      { access: "public" }
    );

    await prisma.reaction.update({
      where: { id: reaction.id },
      data: {
        composedUrl: composedBlob.url,
        selectedLayout: layout,
      },
    });

    return NextResponse.json({
      composedUrl: composedBlob.url,
      cached: false,
    });
  } catch (error) {
    console.error("Error compositing reaction:", error);
    const message = error instanceof Error ? error.message : "Compositing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
