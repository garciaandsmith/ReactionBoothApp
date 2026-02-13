"use client";

import { useState } from "react";
import { isValidYouTubeUrl, extractYouTubeId } from "@/lib/youtube";

export default function CreateReactionForm() {
  const [videoUrl, setVideoUrl] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    boothUrl: string;
    boothToken: string;
  } | null>(null);
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
          senderEmail,
          recipientEmail,
          introMessage: introMessage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to create reaction. Please try again.");
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

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Reaction booth created!
        </h2>
        <p className="text-gray-500 mb-6">
          We&apos;ve sent an email to <strong>{recipientEmail}</strong> with
          their private reaction link. You can also share it directly:
        </p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 mb-6">
          <input
            type="text"
            readOnly
            value={result.boothUrl}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
          />
          <button
            onClick={copyLink}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
        <button
          onClick={() => {
            setResult(null);
            setVideoUrl("");
            setSenderEmail("");
            setRecipientEmail("");
            setIntroMessage("");
          }}
          className="text-indigo-500 text-sm font-medium hover:text-indigo-600"
        >
          Create another reaction
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6"
    >
      <div>
        <label
          htmlFor="videoUrl"
          className="block text-sm font-medium text-gray-700 mb-2"
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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
        />
        {videoId && (
          <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full aspect-video object-cover"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="senderEmail"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Email
          </label>
          <input
            id="senderEmail"
            type="email"
            required
            placeholder="you@example.com"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="recipientEmail"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Recipient&apos;s Email
          </label>
          <input
            id="recipientEmail"
            type="email"
            required
            placeholder="friend@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-gray-900"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="introMessage"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Personal Message{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="introMessage"
          placeholder="Watch this and tell me what you think!"
          value={introMessage}
          onChange={(e) => setIntroMessage(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none text-gray-900"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating...
          </span>
        ) : (
          "Send Reaction Request"
        )}
      </button>
    </form>
  );
}
