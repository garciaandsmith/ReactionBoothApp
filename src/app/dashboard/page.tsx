"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import CreateBoothForm from "@/components/CreateBoothForm";
import BoothCard from "@/components/BoothCard";
import ProjectsTeaser from "@/components/ProjectsTeaser";

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

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);

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
          Sign in to get started
        </h1>
        <p className="text-gray-500 mb-8">
          Create and manage your reaction booths in one place.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session?.user?.email}
        </p>
      </div>

      {/* Create a Booth */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Create a Booth
        </h2>
        <CreateBoothForm onCreated={fetchReactions} />
      </section>

      {/* Your Booths */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Booths
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : reactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No booths yet
            </h3>
            <p className="text-gray-500 text-sm">
              Create your first booth above to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reactions.map((reaction) => (
              <BoothCard key={reaction.id} reaction={reaction} />
            ))}
          </div>
        )}
      </section>

      {/* Projects (Pro teaser) */}
      <ProjectsTeaser />
    </div>
  );
}
