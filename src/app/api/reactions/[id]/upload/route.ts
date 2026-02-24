import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleUpload, put, type HandleUploadBody } from "@vercel/blob/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const reaction = await prisma.reaction.findUnique({
          where: { id: params.id },
        });
        if (!reaction) throw new Error("Reaction not found");

        return {
          allowedContentTypes: ["video/webm", "video/mp4", "video/quicktime"],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
          // Carry the events JSON and reactionId through the upload lifecycle
          tokenPayload: JSON.stringify({
            reactionId: params.id,
            eventsJson: clientPayload ?? null,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { reactionId, eventsJson } = JSON.parse(tokenPayload ?? "{}");

        let eventsUrl: string | null = null;
        if (eventsJson) {
          const eventsBlob = await put(
            `reactions/${reactionId}/events-${Date.now()}.json`,
            eventsJson,
            { access: "public" }
          );
          eventsUrl = eventsBlob.url;
        }

        await prisma.reaction.update({
          where: { id: reactionId },
          data: {
            recordingUrl: blob.url,
            eventsUrl,
            composedUrl: blob.url,
            status: "completed",
            completedAt: new Date(),
          },
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error handling upload:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 400 }
    );
  }
}
