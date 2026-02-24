import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import { join } from "path";
import { PLANS } from "@/lib/constants";
import type { WatchLayout } from "@/lib/types";
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
    // Legacy: local filesystem path used before Vercel Blob migration
    if (eventsUrl.startsWith("/api/uploads/")) {
      const relativePath = eventsUrl.replace("/api/uploads/", "");
      const filePath = join(process.cwd(), "uploads", relativePath);
      const data = await readFile(filePath, "utf-8");
      return JSON.parse(data);
    }

    // Vercel Blob (or any public HTTPS URL)
    if (eventsUrl.startsWith("https://")) {
      const res = await fetch(eventsUrl);
      if (!res.ok) return null;
      return await res.json();
    }
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
  const senderPlan = (reaction.sender?.plan ?? "free") as keyof typeof PLANS;
  const planConfig = PLANS[senderPlan];
  const availableLayouts = [...planConfig.layouts] as WatchLayout[];

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
      availableLayouts={availableLayouts}
    />
  );
}
