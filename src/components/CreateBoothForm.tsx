"use client";

import { useState } from "react";
import { isValidYouTubeUrl, extractYouTubeId } from "@/lib/youtube";

interface CreateBoothFormProps {
  onCreated?: () => void;
}

export default function CreateBoothForm({ onCreated }: CreateBoothFormProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ boothUrl: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const videoId = isValidYouTubeUrl(videoUrl)
    ? extractYouTubeId(videoUrl)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          introMessage: introMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
      onCreated?.();
    } catch {
      setError("Failed to create booth. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.boothUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setResult(null);
    setVideoUrl("");
    setIntroMessage("");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                width="16"
                height="16"
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 mb-2">
                Booth created! Share this link:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.boothUrl}
                  className="flex-1 bg-white text-sm text-gray-700 px-3 py-2 rounded-lg border border-green-200 outline-none truncate"
                />
                <button
                  onClick={copyLink}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-right">
            <button
              onClick={resetForm}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Create another
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="videoUrl"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            YouTube Video URL
          </label>
          <input
            id="videoUrl"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={!!result}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {videoId && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video thumbnail"
                className="w-full aspect-video object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="introMessage"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Personal Message{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="introMessage"
            placeholder="Watch this and tell me what you think!"
            value={introMessage}
            onChange={(e) => setIntroMessage(e.target.value)}
            rows={2}
            maxLength={500}
            disabled={!!result}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!result}
          className="w-full bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            "Create Booth"
          )}
        </button>
      </form>
    </div>
  );
}
