import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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

export default async function WatchPage({ params }: WatchPageProps) {
  const reaction = await prisma.reaction.findUnique({
    where: { id: params.id },
  });

  if (!reaction || !reaction.recordingPath) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reaction Video
        </h1>
        <p className="text-gray-500">
          {reaction.recipientEmail}&apos;s reaction to a video from{" "}
          {reaction.senderEmail}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <video
          src={reaction.recordingPath}
          controls
          className="w-full aspect-video bg-black"
          poster={reaction.thumbnailPath || undefined}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href={reaction.recordingPath}
          download
          className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Download Video
        </a>
        <Link
          href="/create"
          className="text-gray-500 px-6 py-3 rounded-xl font-medium hover:text-gray-700 transition-colors"
        >
          Create Your Own Reaction
        </Link>
      </div>

      {reaction.watermarked && (
        <p className="text-center text-xs text-gray-400 mt-6">
          This video includes a ReactionBooth watermark.{" "}
          <Link href="/#pricing" className="text-indigo-400 hover:text-indigo-500">
            Upgrade to Pro
          </Link>{" "}
          for watermark-free reactions.
        </p>
      )}
    </div>
  );
}
