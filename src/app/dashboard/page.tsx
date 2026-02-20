"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import CreateBoothForm from "@/components/CreateBoothForm";
import BoothCard from "@/components/BoothCard";

interface Reaction {
  id: string;
  videoUrl: string;
  videoTitle: string | null;
  senderEmail: string;
  recipientEmail: string;
  status: string;
  boothToken: string;
  createdAt: string;
  completedAt: string | null;
  recordingUrl: string | null;
  watermarked: boolean;
}

type Tab = "booths" | "create";

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("booths");

  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch("/api/reactions");
      const data = await res.json();
      setReactions(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchReactions();
    }
  }, [authStatus, fetchReactions]);

  const handleBoothCreated = useCallback(() => {
    fetchReactions();
    setActiveTab("booths");
  }, [fetchReactions]);

  if (authStatus === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-brand rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to get started</h1>
        <p className="text-gray-500 mb-8">Create and manage your reaction booths in one place.</p>
        <Link
          href="/api/auth/signin"
          className="inline-block bg-brand text-soft-black px-8 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const pendingCount = reactions.filter((r) => r.status === "pending" || r.status === "opened").length;
  const completedCount = reactions.filter((r) => r.status === "completed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">{session?.user?.email}</p>
            </div>
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{reactions.length}</p>
                <p className="text-xs text-gray-500">Total Booths</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-brand">{completedCount}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                <p className="text-xs text-gray-500">Awaiting</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("booths")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "booths"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Booths
              {reactions.length > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === "booths" ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-500"
                }`}>
                  {reactions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "create"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Booth
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === "create" && (
          <div className="max-w-xl">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Create a Booth</h2>
              <p className="text-gray-500 text-sm mt-1">
                Paste a YouTube link and share the booth link to capture someone&apos;s genuine reaction.
              </p>
            </div>
            <CreateBoothForm onCreated={handleBoothCreated} />
          </div>
        )}

        {activeTab === "booths" && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-brand rounded-full animate-spin mx-auto" />
              </div>
            ) : reactions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No booths yet</h3>
                <p className="text-gray-500 text-sm mb-6">Create your first booth to get started.</p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="bg-brand text-soft-black px-6 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
                >
                  Create Your First Booth
                </button>
              </div>
            ) : (
              <>
                {/* Group by status */}
                {["completed", "pending", "opened", "recording", "expired"].map((status) => {
                  const group = reactions.filter((r) => r.status === status);
                  if (group.length === 0) return null;
                  const labels: Record<string, string> = {
                    completed: "Completed",
                    pending: "Awaiting Response",
                    opened: "Opened",
                    recording: "Recording in Progress",
                    expired: "Expired",
                  };
                  return (
                    <div key={status} className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-sm font-semibold text-gray-700">{labels[status]}</h2>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{group.length}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.map((reaction) => (
                          <BoothCard key={reaction.id} reaction={reaction} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Floating New Booth button (visible on My Booths tab) */}
      {activeTab === "booths" && reactions.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setActiveTab("create")}
            className="flex items-center gap-2 bg-brand text-soft-black px-5 py-3 rounded-xl font-medium shadow-lg hover:bg-brand-600 transition-all hover:shadow-xl"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Booth
          </button>
        </div>
      )}
    </div>
  );
}
