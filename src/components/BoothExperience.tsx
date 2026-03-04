"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useSession } from "next-auth/react";
import DualRecorder from "./DualRecorder";
import YouTubePlayer, { YouTubePlayerHandle } from "./YouTubePlayer";
import type { ReactionEventLog } from "@/lib/types";

interface Reaction {
  id: string;
  videoUrl: string;
  requesterName: string | null;
  recipientName: string | null;
  introMessage: string | null;
  maxVideoLength: number;
  watermarked: boolean;
}

type BoothStep = "welcome" | "recording" | "review" | "uploading" | "done";

const MAX_RERECORDS = 3;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BoothExperience({ reaction }: { reaction: Reaction }) {
  const { data: session } = useSession();
  const [step, setStep] = useState<BoothStep>("welcome");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  // Review step state
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingEvents, setPendingEvents] = useState<ReactionEventLog | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reRecordCount, setReRecordCount] = useState(0);
  const [showingPreview, setShowingPreview] = useState(false);
  const [showReRecordWarning, setShowReRecordWarning] = useState(false);
  // Preview playback state
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewYoutubeReady, setPreviewYoutubeReady] = useState(false);
  const previewYoutubeRef = useRef<YouTubePlayerHandle>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewVideoMobileRef = useRef<HTMLVideoElement>(null);

  // Clean up object URL when leaving review or unmounting
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a recording is done, store it and go to review
  const handleRecordingComplete = useCallback((blob: Blob, events: ReactionEventLog) => {
    // Revoke previous preview URL if any
    setPreviewUrl((prev: string | null) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    setPendingBlob(blob);
    setPendingEvents(events);
    setShowingPreview(false);
    setShowReRecordWarning(false);
    setStep("review");
  }, []);

  // Upload the stored blob
  const handleSubmit = useCallback(async () => {
    if (!pendingBlob || !pendingEvents) return;
    setStep("uploading");
    setUploadProgress(0);

    try {
      const result = await upload(
        `reactions/${reaction.id}/reaction-${Date.now()}.webm`,
        pendingBlob,
        {
          access: "public",
          handleUploadUrl: `/api/reactions/${reaction.id}/upload`,
          onUploadProgress: ({ percentage }: { percentage: number }) => {
            setUploadProgress(Math.round(percentage));
          },
        }
      );

      const res = await fetch(`/api/reactions/${reaction.id}/upload`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: result.url,
          eventsJson: JSON.stringify(pendingEvents),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save recording");
      }

      // Release the blob URL now that we're done with it
      setPreviewUrl((prev: string | null) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      setUploadProgress(100);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload recording");
      setStep("review");
    }
  }, [pendingBlob, pendingEvents, reaction.id]);

  // Go back to re-record
  const handleReRecord = useCallback(() => {
    setReRecordCount((c: number) => c + 1);
    setShowReRecordWarning(false);
    setShowingPreview(false);
    setPreviewPlaying(false);
    setPreviewYoutubeReady(false);
    setPendingBlob(null);
    setPendingEvents(null);
    setStep("recording");
  }, []);

  // Start the synced preview playback
  const handlePlayPreview = useCallback(() => {
    previewYoutubeRef.current?.seekTo(0);
    previewYoutubeRef.current?.play();
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = 0;
      previewVideoRef.current.play().catch(() => {});
    }
    if (previewVideoMobileRef.current) {
      previewVideoMobileRef.current.currentTime = 0;
      previewVideoMobileRef.current.play().catch(() => {});
    }
    setPreviewPlaying(true);
  }, []);

  // ── Welcome ──
  if (step === "welcome") {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        {/* Mascot with floating sparkle decorations */}
        <div className="relative w-24 mx-auto mb-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-brand/20 rounded-full blur-2xl" />
          <Image
            src="/assets/mascotsmile.svg"
            alt="Smiling mascot welcoming you"
            width={96}
            height={96}
            className="relative mascot-float"
          />
          <svg className="absolute -top-3 -right-7 w-7 h-7 sparkle-a" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#2EE6A6" />
          </svg>
          <svg className="absolute top-0 -left-8 w-5 h-5 sparkle-b" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#2EE6A6" />
          </svg>
          <svg className="absolute -bottom-1 -left-3 w-4 h-4 sparkle-c" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M14 1 L16 12 L14 27 L12 12Z M1 14 L12 16 L27 14 L12 12Z" fill="#121212" fillOpacity="0.35" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {reaction.recipientName
            ? `Hey ${reaction.recipientName}!`
            : "You've been invited to a Reaction Booth!"}
        </h1>
        <p className="text-gray-500 mb-4">
          {reaction.requesterName
            ? `${reaction.requesterName} wants to see your reaction to a video.`
            : "Someone wants to see your reaction to a video."}
        </p>
        {reaction.introMessage && (
          <div className="bg-brand-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Their message:</p>
            <p className="text-soft-black italic">&ldquo;{reaction.introMessage}&rdquo;</p>
          </div>
        )}

        {/* Headphones recommendation */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          <p className="text-sm text-amber-700">
            <strong>Headphones recommended!</strong> Wearing headphones prevents the video audio from
            being picked up by your microphone, resulting in a cleaner reaction recording.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">Here&apos;s how it works:</h3>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-brand-100 text-soft-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <p className="text-sm text-gray-600">
              We&apos;ll ask for camera and microphone access to record your reaction
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-brand-100 text-soft-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <p className="text-sm text-gray-600">
              Press <strong>Start Recording</strong> — a 5-second countdown will appear, then the
              video plays and recording begins simultaneously
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-brand-100 text-soft-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <p className="text-sm text-gray-600">
              When you&apos;re done, you can preview your reaction, submit it, or re-record (up to 3
              times)
            </p>
          </div>
        </div>

        <button
          onClick={() => setStep("recording")}
          className="bg-brand text-soft-black px-8 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Let&apos;s Go!
        </button>

        <p className="text-xs text-gray-400 mt-4">
          For the best experience, use a desktop or laptop computer.
        </p>
      </div>
    );
  }

  // ── Recording ──
  if (step === "recording") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {reRecordCount > 0 && (
          <div className="mb-4 flex items-center justify-between text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <span>Re-record attempt {reRecordCount} of {MAX_RERECORDS}</span>
            <span className="text-amber-600 font-medium">
              {MAX_RERECORDS - reRecordCount} {MAX_RERECORDS - reRecordCount === 1 ? "attempt" : "attempts"} left
            </span>
          </div>
        )}
        <DualRecorder
          videoUrl={reaction.videoUrl}
          maxDuration={reaction.maxVideoLength}
          watermarked={reaction.watermarked}
          onRecordingComplete={handleRecordingComplete}
          onError={setError}
        />
        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Review ──
  if (step === "review") {
    const attemptsLeft = MAX_RERECORDS - reRecordCount;
    const recordingDurationSec = pendingEvents
      ? Math.round(pendingEvents.recordingDurationMs / 1000)
      : 0;

    if (showingPreview) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => { setShowingPreview(false); setPreviewPlaying(false); setPreviewYoutubeReady(false); }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to options
          </button>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview your reaction</h2>

          {/* Preview layout: PIP on desktop, stacked on mobile */}
          <div className="space-y-3 sm:space-y-0">
            {/* YouTube + PIP container (desktop) */}
            <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
              <YouTubePlayer
                ref={previewYoutubeRef}
                videoUrl={reaction.videoUrl}
                controlledMode={false}
                onReady={() => setPreviewYoutubeReady(true)}
                className="absolute inset-0 w-full h-full"
              />

              {/* Webcam PIP — desktop only, no controls (too small) */}
              {previewUrl && (
                <video
                  ref={previewVideoRef}
                  src={previewUrl}
                  muted={false}
                  playsInline
                  className="hidden sm:block absolute bottom-3 right-3 rounded-xl shadow-xl border border-white/20 z-10 pointer-events-none"
                  style={{ width: 176, aspectRatio: "16/9" }}
                />
              )}

              {/* Play overlay — blocks YouTube direct interaction and shows the play button */}
              {!previewPlaying && (
                <div className="absolute inset-0 z-20 bg-black/50 flex flex-col items-center justify-center gap-3">
                  {previewYoutubeReady ? (
                    <button
                      onClick={handlePlayPreview}
                      className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 pl-5 pr-7 py-4 rounded-2xl font-semibold text-lg shadow-2xl transition-transform hover:scale-105 active:scale-100"
                    >
                      <span className="w-12 h-12 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#121212" className="ml-1">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </span>
                      Play preview
                    </button>
                  ) : (
                    <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <p className="text-white/60 text-sm">
                    Both videos will start together
                  </p>
                </div>
              )}
            </div>

            {/* Webcam stacked — mobile only, with controls */}
            {previewUrl && (
              <video
                ref={previewVideoMobileRef}
                src={previewUrl}
                controls
                playsInline
                className="sm:hidden w-full rounded-2xl bg-black"
                style={{ aspectRatio: "16/9" }}
              />
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Your webcam reaction plays alongside the YouTube video. The final composite is
            generated after you submit.
          </p>

          {/* Actions in preview mode */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-brand text-soft-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors text-center"
            >
              Submit this recording
            </button>
            {attemptsLeft > 0 && (
              <button
                onClick={() => setShowReRecordWarning(true)}
                className="flex-1 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Re-record ({attemptsLeft} left)
              </button>
            )}
          </div>

          {/* Re-record warning dialog */}
          {showReRecordWarning && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Discard this recording?
                </h3>
                <p className="text-gray-500 text-sm text-center mb-1">
                  This recording will be <strong className="text-gray-700">permanently deleted</strong>.
                  You cannot get it back.
                </p>
                <p className="text-gray-400 text-xs text-center mb-6">
                  {attemptsLeft - 1 === 0
                    ? "This is your last re-record attempt."
                    : `You will have ${attemptsLeft - 1} re-record ${attemptsLeft - 1 === 1 ? "attempt" : "attempts"} left.`}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleReRecord}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Yes, discard and re-record
                  </button>
                  <button
                    onClick={() => setShowReRecordWarning(false)}
                    className="w-full border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel — keep this recording
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default review options view
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reaction captured!
        </h2>
        <p className="text-gray-500 mb-1">
          Duration: <span className="font-medium text-gray-700">{formatTime(recordingDurationSec)}</span>
        </p>
        <p className="text-gray-400 text-sm mb-8">
          What would you like to do with this recording?
        </p>

        <div className="flex flex-col gap-3">
          {/* Primary: submit */}
          <button
            onClick={handleSubmit}
            className="w-full bg-brand text-soft-black px-6 py-3.5 rounded-xl font-semibold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Submit recording
          </button>

          {/* Preview */}
          <button
            onClick={() => setShowingPreview(true)}
            className="w-full border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            Preview my reaction
          </button>

          {/* Re-record */}
          {attemptsLeft > 0 ? (
            <button
              onClick={() => setShowReRecordWarning(true)}
              className="w-full border border-gray-200 text-gray-500 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
              </svg>
              Re-record ({attemptsLeft} {attemptsLeft === 1 ? "attempt" : "attempts"} left)
            </button>
          ) : (
            <p className="text-xs text-gray-400 py-2">
              No re-record attempts remaining.
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-5">
          Re-recording permanently deletes this recording.
        </p>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Re-record warning dialog */}
        {showReRecordWarning && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Discard this recording?
              </h3>
              <p className="text-gray-500 text-sm text-center mb-1">
                This recording will be <strong className="text-gray-700">permanently deleted</strong>.
                You cannot get it back.
              </p>
              <p className="text-gray-400 text-xs text-center mb-6">
                {attemptsLeft - 1 === 0
                  ? "This is your last re-record attempt."
                  : `You will have ${attemptsLeft - 1} re-record ${attemptsLeft - 1 === 1 ? "attempt" : "attempts"} left.`}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleReRecord}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Yes, discard and re-record
                </button>
                <button
                  onClick={() => setShowReRecordWarning(false)}
                  className="w-full border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel — keep this recording
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Uploading ──
  if (step === "uploading") {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <Image
          src="/assets/mascotooh.svg"
          alt="Excited mascot"
          width={80}
          height={80}
          className="mx-auto mb-4 mascot-ooh"
        />
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Uploading your reaction...
        </h2>
        <p className="text-gray-500 mb-6">Hang tight, this won&apos;t take long.</p>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">{uploadProgress}%</p>
      </div>
    );
  }

  // ── Done ──
  const createBoothHref = session?.user ? "/dashboard" : "/auth/signin";
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      {/* Animated checkmark */}
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">Reaction submitted!</h1>
      <p className="text-gray-500 mb-10">
        Your reaction has been saved.{" "}
        {reaction.requesterName ? `${reaction.requesterName} can` : "The person who sent this link can"}{" "}
        now watch it.
      </p>

      {/* CTA */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-500 mb-4">
          Want to capture someone else&apos;s reaction to a video you love?
        </p>
        <a
          href={createBoothHref}
          className="inline-flex items-center gap-2 bg-brand text-soft-black px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create a Reaction Booth
        </a>
        {!session?.user && (
          <p className="text-xs text-gray-400 mt-3">Free to sign up — no credit card required</p>
        )}
      </div>

      <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
        Back to ReactionBooth
      </a>
    </div>
  );
}
