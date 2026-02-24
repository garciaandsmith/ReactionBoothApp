import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { put } from "@vercel/blob";

// POST — used by the Vercel Blob client SDK for two things:
//   1. Generating a client upload token (blob.generate-client-token)
//   2. Acknowledging upload completion webhook (blob.upload-completed)
//   The actual DB update is done explicitly by the client via PATCH to
//   avoid webhook timing races.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        const reaction = await prisma.reaction.findUnique({
          where: { id: params.id },
        });
        if (!reaction) throw new Error("Reaction not found");

        return {
          allowedContentTypes: ["video/webm", "video/mp4", "video/quicktime"],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
        };
      },
      // DB update is handled by PATCH below; nothing to do here.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error handling upload token:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 400 }
    );
  }
}

// PATCH — called by the client after the Vercel Blob upload resolves,
//   passing the final blob URL + events JSON for DB persistence.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { blobUrl, eventsJson } = (await request.json()) as {
      blobUrl: string;
      eventsJson: string | null;
    };

    const reaction = await prisma.reaction.findUnique({
      where: { id: params.id },
    });
    if (!reaction) {
      return NextResponse.json({ error: "Reaction not found" }, { status: 404 });
    }

    let eventsUrl: string | null = null;
    if (eventsJson) {
      const eventsBlob = await put(
        `reactions/${params.id}/events-${Date.now()}.json`,
        eventsJson,
        { access: "public" }
      );
      eventsUrl = eventsBlob.url;
    }

    await prisma.reaction.update({
      where: { id: params.id },
      data: {
        recordingUrl: blobUrl,
        eventsUrl,
        composedUrl: blobUrl,
        status: "completed",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error completing upload:", error);
    return NextResponse.json(
      { error: "Failed to save recording" },
      { status: 500 }
    );
  }
}
