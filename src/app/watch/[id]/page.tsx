import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import { join } from "path";
import WatchPlayer from "./WatchPlayer";

interface WatchPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: WatchPageProps) {
  const reaction = await prisma.reaction.findUnique({
    where: { id: params.id },
  });

  return {
    title: reaction
      ? "Watch Reaction — ReactionBooth"
      : "Not Found — ReactionBooth",
  };
}

async function fetchEvents(eventsUrl: string | null) {
  if (!eventsUrl) return null;

  try {
    // Local file URL
    if (eventsUrl.startsWith("/api/uploads/")) {
      const relativePath = eventsUrl.replace("/api/uploads/", "");
      const filePath = join(process.cwd(), "uploads", relativePath);
      const data = await readFile(filePath, "utf-8");
      return JSON.parse(data);
    }

    // Remote URL (Vercel Blob etc.)
    const res = await fetch(eventsUrl, { cache: "force-cache" });
    if (res.ok) return res.json();
  } catch (e) {
    console.error("Failed to fetch events:", e);
  }

  return null;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const reaction = await prisma.reaction.findUnique({
    where: { id: params.id },
    include: { sender: { select: { plan: true } } },
  });

  if (!reaction || !reaction.recordingUrl) {
    notFound();
  }

  const events = await fetchEvents(reaction.eventsUrl);
  const senderPlan = reaction.sender?.plan ?? "free";

  return (
    <WatchPlayer
      reaction={{
        id: reaction.id,
        videoUrl: reaction.videoUrl,
        recordingUrl: reaction.recordingUrl,
        senderEmail: reaction.senderEmail,
        recipientEmail: reaction.recipientEmail,
        watermarked: reaction.watermarked,
        selectedLayout: reaction.selectedLayout,
        downloadCount: reaction.downloadCount,
      }}
      events={events}
      senderPlan={senderPlan}
    />
  );
}
