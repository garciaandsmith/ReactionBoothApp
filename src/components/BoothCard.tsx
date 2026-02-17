"use client";

import { useState } from "react";
import Link from "next/link";
import { extractYouTubeId } from "@/lib/youtube";

interface BoothCardProps {
  reaction: {
    id: string;
    videoUrl: string;
    videoTitle: string | null;
    status: string;
    boothToken: string;
    createdAt: string;
    recordingUrl: string | null;
  };
}

const statusConfig: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
  opened: { bg: "bg-blue-100", text: "text-blue-700", label: "Opened" },
  recording: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Recording",
  },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
  expired: { bg: "bg-gray-100", text: "text-gray-500", label: "Expired" },
};

export default function BoothCard({ reaction }: BoothCardProps) {
  const [copied, setCopied] = useState(false);
  const videoId = extractYouTubeId(reaction.videoUrl);
  const status = statusConfig[reaction.status] || statusConfig.expired;

  const copyLink = async () => {
    const boothUrl = `${window.location.origin}/booth/${reaction.boothToken}`;
    await navigator.clipboard.writeText(boothUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
      {videoId && (
        <div className="relative aspect-video bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={reaction.videoTitle || "Video thumbnail"}
            className="w-full h-full object-cover"
          />
          <span
            className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-0.5 rounded-full ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm truncate mb-1">
          {reaction.videoTitle || "Untitled video"}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Created {new Date(reaction.createdAt).toLocaleDateString()}
        </p>

        <div className="flex items-center gap-2">
          {reaction.status === "completed" && reaction.recordingUrl ? (
            <Link
              href={`/watch/${reaction.id}`}
              className="flex-1 text-center bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Watch
            </Link>
          ) : reaction.status === "pending" ||
            reaction.status === "opened" ? (
            <button
              onClick={copyLink}
              className="flex-1 text-center bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              {copied ? "Copied!" : "Copy Booth Link"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
