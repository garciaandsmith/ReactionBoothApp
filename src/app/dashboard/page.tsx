"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Reaction {
  id: string;
  videoUrl: string;
  videoTitle: string | null;
  senderEmail: string;
  recipientEmail: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  recordingUrl: string | null;
  watermarked: boolean;
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetch("/api/reactions")
        .then((res) => res.json())
        .then((data) => {
          setReactions(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [authStatus]);

  if (authStatus === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sign in to view your dashboard
        </h1>
        <p className="text-gray-500 mb-8">
          Track all your sent and received reactions in one place.
        </p>
        <Link
          href="/api/auth/signin"
          className="inline-block bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    opened: "bg-blue-100 text-blue-700",
    recording: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {session?.user?.email}&apos;s reactions
          </p>
        </div>
        <Link
          href="/create"
          className="bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-600 transition-colors text-sm"
        >
          New Reaction
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : reactions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
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
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No reactions yet
          </h2>
          <p className="text-gray-500 mb-6">
            Create your first reaction to get started.
          </p>
          <Link
            href="/create"
            className="inline-block bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-600 transition-colors text-sm"
          >
            Create a Reaction
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[reaction.status] || "bg-gray-100 text-gray-500"}`}
                  >
                    {reaction.status}
                  </span>
                  {reaction.videoTitle && (
                    <span className="text-sm text-gray-700 truncate">
                      {reaction.videoTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {reaction.senderEmail === session?.user?.email
                      ? `To: ${reaction.recipientEmail}`
                      : `From: ${reaction.senderEmail}`}
                  </span>
                  <span>
                    {new Date(reaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {reaction.status === "completed" && reaction.recordingUrl && (
                <Link
                  href={`/watch/${reaction.id}`}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
                >
                  Watch
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
