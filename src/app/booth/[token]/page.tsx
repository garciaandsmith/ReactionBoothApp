import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BoothExperience from "@/components/BoothExperience";

interface BoothPageProps {
  params: { token: string };
}

export async function generateMetadata({ params }: BoothPageProps) {
  const reaction = await prisma.reaction.findUnique({
    where: { boothToken: params.token },
  });

  return {
    title: reaction
      ? "Your Reaction Booth — ReactionBooth"
      : "Not Found — ReactionBooth",
  };
}

export default async function BoothPage({ params }: BoothPageProps) {
  const reaction = await prisma.reaction.findUnique({
    where: { boothToken: params.token },
  });

  if (!reaction) {
    notFound();
  }

  if (reaction.status === "expired" || new Date() > reaction.expiresAt) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Link expired
        </h1>
        <p className="text-gray-500">
          This reaction booth link has expired. Ask the sender to create a new
          one.
        </p>
      </div>
    );
  }

  if (reaction.status === "completed") {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Already recorded
        </h1>
        <p className="text-gray-500">
          This reaction has already been recorded and is ready to watch.
        </p>
      </div>
    );
  }

  // Mark as opened if still pending
  if (reaction.status === "pending") {
    await prisma.reaction.update({
      where: { id: reaction.id },
      data: { status: "opened", openedAt: new Date() },
    });
  }

  return (
    <BoothExperience
      reaction={{
        id: reaction.id,
        videoUrl: reaction.videoUrl,
        introMessage: reaction.introMessage,
        maxVideoLength: reaction.maxVideoLength,
        watermarked: reaction.watermarked,
      }}
    />
  );
}
