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
    openedAt: string | null;
    completedAt: string | null;
    downloadCount: number;
    watermarked: boolean;
    recordingUrl: string | null;
  };
  viewMode?: "mosaic" | "list";
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
  opened: { bg: "bg-blue-100", text: "text-blue-700", label: "Opened" },
  recording: { bg: "bg-purple-100", text: "text-purple-700", label: "Recording" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
  expired: { bg: "bg-gray-100", text: "text-gray-500", label: "Expired" },
};

function formatDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DownloadBadge({ watermarked, downloadCount }: { watermarked: boolean; downloadCount: number }) {
  const downloadUsed = watermarked && downloadCount >= 1;

  if (!watermarked) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Pro · No watermark
      </span>
    );
  }

  if (downloadUsed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Download used
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Free · 1 download
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
        className="flex-1 text-center bg-brand-50 text-soft-black px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
      >
        Watch
      </Link>
    ) : reaction.status === "pending" || reaction.status === "opened" ? (
      <button
        onClick={copyLink}
        className="flex-1 text-center bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        {copied ? "Copied!" : "Copy Booth Link"}
      </button>
    ) : null;

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors flex items-stretch">
        {videoId && (
          <div className="relative w-28 flex-shrink-0 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={reaction.videoTitle || "Video thumbnail"}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex flex-1 items-center px-4 py-3 gap-4 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <h3 className="font-medium text-gray-900 text-sm truncate">{reaction.videoTitle || "Untitled video"}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <p className="text-xs text-gray-400">
                <span className="text-gray-500 font-medium">Created</span> {formatDateTime(reaction.createdAt)}
              </p>
              {reaction.completedAt && (
                <p className="text-xs text-gray-400">
                  <span className="text-gray-500 font-medium">Completed</span> {formatDateTime(reaction.completedAt)}
                </p>
              )}
              {reaction.downloadCount > 0 && (
                <p className="text-xs text-gray-400">
                  <span className="text-gray-500 font-medium">Downloads</span> {reaction.downloadCount}×
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <DownloadBadge watermarked={reaction.watermarked} downloadCount={reaction.downloadCount} />
            {actionButton && <div className="flex">{actionButton}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Mosaic (default)
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
          <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-0.5 rounded-full ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm truncate mb-2">
          {reaction.videoTitle || "Untitled video"}
        </h3>
        <div className="space-y-0.5 mb-3">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Created</span> {formatDateTime(reaction.createdAt)}
          </p>
          {reaction.completedAt && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Completed</span> {formatDateTime(reaction.completedAt)}
            </p>
          )}
          {reaction.downloadCount > 0 && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Downloads</span> {reaction.downloadCount}×
            </p>
          )}
        </div>
        <div className="mb-3">
          <DownloadBadge watermarked={reaction.watermarked} downloadCount={reaction.downloadCount} />
        </div>
        <div className="flex items-center gap-2">{actionButton}</div>
      </div>
    </div>
  );
}
