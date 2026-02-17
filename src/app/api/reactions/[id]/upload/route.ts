import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

async function saveJsonLocally(filename: string, content: string): Promise<string> {
  const parts = filename.split("/");
  const dir = join(process.cwd(), "uploads", ...parts.slice(0, -1));
  await mkdir(dir, { recursive: true });
  await writeFile(join(process.cwd(), "uploads", filename), content, "utf-8");
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
    const eventsJson = formData.get("events") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No recording file provided" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const videoFilename = `reactions/${reaction.id}/reaction-${timestamp}.webm`;
    const eventsFilename = `reactions/${reaction.id}/events-${timestamp}.json`;

    let eventsUrl: string | null = null;

    const recordingUrl = await saveLocally(videoFilename, file);

    if (eventsJson) {
      eventsUrl = await saveJsonLocally(eventsFilename, eventsJson);
    }

    const updated = await prisma.reaction.update({
      where: { id: reaction.id },
      data: {
        recordingUrl,
        eventsUrl,
        composedUrl: recordingUrl,
        status: "completed",
        completedAt: new Date(),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const watchUrl = `${appUrl}/watch/${reaction.id}`;

    return NextResponse.json({
      id: updated.id,
      recordingUrl,
      eventsUrl,
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
