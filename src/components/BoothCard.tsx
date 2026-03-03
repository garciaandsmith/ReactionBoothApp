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
    completedAt: string | null;
    recordingUrl: string | null;
    watermarked: boolean;
    downloadCount: number;
  };
  viewMode?: "mosaic" | "list";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DownloadBadge({
  watermarked,
  downloadCount,
}: {
  watermarked: boolean;
  downloadCount: number;
}) {
  if (watermarked) {
    // Free user — burn-after-use
    const used = downloadCount > 0;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
          used
            ? "bg-red-50 text-red-600"
            : "bg-green-50 text-green-700"
        }`}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {used ? "Download used" : "Download available"}
      </span>
    );
  }

  // Paid user — show count
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-brand-50 text-brand-700">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {downloadCount === 0 ? "No downloads yet" : `${downloadCount} download${downloadCount !== 1 ? "s" : ""}`}
    </span>
  );
}

export default function BoothCard({ reaction, viewMode = "mosaic" }: BoothCardProps) {
  const [copied, setCopied] = useState(false);
  const videoId = extractYouTubeId(reaction.videoUrl);
  const status = statusConfig[reaction.status] || statusConfig.expired;

  const copyLink = async () => {
    const boothUrl = `${window.location.origin}/booth/${reaction.boothToken}`;
    await navigator.clipboard.writeText(boothUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionButton =
    reaction.status === "completed" && reaction.recordingUrl ? (
      <Link
        href={`/watch/${reaction.id}`}
        className="flex-shrink-0 text-center bg-brand-50 text-soft-black px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
      >
        Watch
      </Link>
    ) : reaction.status === "pending" || reaction.status === "opened" ? (
      <button
        onClick={copyLink}
        className="flex-shrink-0 text-center bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
      >
        {copied ? "Copied!" : "Copy Booth Link"}
      </button>
    ) : null;

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-4 p-3 overflow-hidden">
        {/* Thumbnail */}
        {videoId ? (
          <div className="flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={reaction.videoTitle || "Video thumbnail"}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-24 h-14 rounded-lg bg-gray-100" />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 text-sm truncate">
              {reaction.videoTitle || "Untitled video"}
            </h3>
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-400">
              Created {formatDate(reaction.createdAt)}
            </span>
            {reaction.completedAt && (
              <span className="text-xs text-gray-400">
                Recorded {formatDate(reaction.completedAt)}
              </span>
            )}
            {reaction.status === "completed" && (
              <DownloadBadge
                watermarked={reaction.watermarked}
                downloadCount={reaction.downloadCount}
              />
            )}
          </div>
        </div>

        {/* Action */}
        {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
      </div>
    );
  }

  // Mosaic view (default)
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
        <h3 className="font-medium text-gray-900 text-sm truncate mb-2">
          {reaction.videoTitle || "Untitled video"}
        </h3>

        {/* Dates */}
        <div className="flex flex-col gap-0.5 mb-2">
          <p className="text-xs text-gray-400">
            Created {formatDate(reaction.createdAt)}
          </p>
          {reaction.completedAt && (
            <p className="text-xs text-gray-400">
              Recorded {formatDate(reaction.completedAt)}
            </p>
          )}
        </div>

        {/* Download info (only for completed) */}
        {reaction.status === "completed" && (
          <div className="mb-3">
            <DownloadBadge
              watermarked={reaction.watermarked}
              downloadCount={reaction.downloadCount}
            />
          </div>
        )}

        {/* Action button */}
        {actionButton && <div className="flex items-center gap-2">{actionButton}</div>}
      </div>
    </div>
  );
}
