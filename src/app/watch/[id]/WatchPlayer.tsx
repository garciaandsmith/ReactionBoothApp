"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import YouTubePlayer, { YouTubePlayerHandle } from "@/components/YouTubePlayer";
import type { ReactionEventLog, WatchLayout } from "@/lib/types";
import { LAYOUTS } from "@/lib/constants";

interface WatchPlayerProps {
  reaction: {
    id: string;
    videoUrl: string;
    recordingUrl: string;
    senderEmail: string;
    recipientEmail: string;
    watermarked: boolean;
    selectedLayout: string | null;
    downloadCount: number;
  };
  events: ReactionEventLog | null;
  senderPlan: string;
}

type DownloadState =
  | { status: "idle" }
  | { status: "choosing" }
  | { status: "composing"; layout: WatchLayout }
  | { status: "ready"; url: string }
  | { status: "error"; message: string };

export default function WatchPlayer({
  reaction,
  events,
  senderPlan,
}: WatchPlayerProps) {
  const youtubeRef = useRef<YouTubePlayerHandle>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const syncFrameRef = useRef<number>(0);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [downloadUsed, setDownloadUsed] = useState(
    senderPlan === "free" && reaction.downloadCount >= 1
  );
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: "idle",
  });

  const availableLayouts: WatchLayout[] =
    senderPlan === "pro"
      ? ["pip-desktop", "stacked-mobile"]
      : ["pip-desktop"];

  // --- Synchronized playback ---

  const syncYouTubeToWebcam = useCallback(() => {
    if (!youtubeRef.current || !webcamRef.current || !events) return;

    const webcamTimeMs = webcamRef.current.currentTime * 1000;

    let lastPlayEvent: (typeof events.events)[number] | null = null;
    let lastPauseOrEnd: (typeof events.events)[number] | null = null;

    for (const event of events.events) {
      if (event.timestampMs > webcamTimeMs) break;
      if (event.type === "play") lastPlayEvent = event;
      if (event.type === "pause" || event.type === "ended")
        lastPauseOrEnd = event;
    }

    const shouldBePlaying =
      lastPlayEvent &&
      (!lastPauseOrEnd ||
        lastPlayEvent.timestampMs > lastPauseOrEnd.timestampMs);

    if (shouldBePlaying && lastPlayEvent) {
      const elapsedSincePlay = webcamTimeMs - lastPlayEvent.timestampMs;
      const expectedYtTime =
        lastPlayEvent.videoTimeS + elapsedSincePlay / 1000;

      const actualYtTime = youtubeRef.current.getCurrentTime();
      const drift = Math.abs(actualYtTime - expectedYtTime);

      if (drift > 0.5) {
        youtubeRef.current.seekTo(expectedYtTime);
      }

      if (youtubeRef.current.getPlayerState() !== 1) {
        youtubeRef.current.play();
      }
    } else {
      if (youtubeRef.current.getPlayerState() === 1) {
        youtubeRef.current.pause();
      }
    }
  }, [events]);

  const startSyncLoop = useCallback(() => {
    const loop = () => {
      syncYouTubeToWebcam();
      syncFrameRef.current = requestAnimationFrame(loop);
    };
    syncFrameRef.current = requestAnimationFrame(loop);
  }, [syncYouTubeToWebcam]);

  const stopSyncLoop = useCallback(() => {
    if (syncFrameRef.current) {
      cancelAnimationFrame(syncFrameRef.current);
      syncFrameRef.current = 0;
    }
  }, []);

  useEffect(() => {
    const webcam = webcamRef.current;
    if (!webcam || !events) return;

    const onPlay = () => {
      syncYouTubeToWebcam();
      startSyncLoop();
    };
    const onPause = () => {
      youtubeRef.current?.pause();
      stopSyncLoop();
    };
    const onSeeked = () => {
      syncYouTubeToWebcam();
    };
    const onEnded = () => {
      youtubeRef.current?.pause();
      stopSyncLoop();
    };

    webcam.addEventListener("play", onPlay);
    webcam.addEventListener("pause", onPause);
    webcam.addEventListener("seeked", onSeeked);
    webcam.addEventListener("ended", onEnded);

    return () => {
      webcam.removeEventListener("play", onPlay);
      webcam.removeEventListener("pause", onPause);
      webcam.removeEventListener("seeked", onSeeked);
      webcam.removeEventListener("ended", onEnded);
      stopSyncLoop();
    };
  }, [events, syncYouTubeToWebcam, startSyncLoop, stopSyncLoop]);

  // --- Download with layout selection + compositing ---

  const handleDownloadClick = useCallback(() => {
    if (downloadUsed) return;

    if (!events || events.events.length === 0) {
      // No events — download webcam-only
      window.open(`/api/reactions/${reaction.id}/download`, "_blank");
      if (senderPlan === "free") setDownloadUsed(true);
      return;
    }

    if (availableLayouts.length === 1) {
      // Only one option — skip chooser, go straight to compositing
      triggerCompose(availableLayouts[0]);
    } else {
      setDownloadState({ status: "choosing" });
    }
  }, [downloadUsed, events, reaction.id, senderPlan, availableLayouts]);

  const triggerCompose = useCallback(
    async (layout: WatchLayout) => {
      setDownloadState({ status: "composing", layout });

      try {
        const res = await fetch(`/api/reactions/${reaction.id}/compose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layout }),
        });

        const data = await res.json();

        if (!res.ok) {
          setDownloadState({
            status: "error",
            message: data.error || "Compositing failed",
          });
          return;
        }

        setDownloadState({ status: "ready", url: data.composedUrl });

        // Increment download count
        if (senderPlan === "free") {
          setDownloadUsed(true);
        }
      } catch {
        setDownloadState({
          status: "error",
          message: "Network error. Please try again.",
        });
      }
    },
    [reaction.id, senderPlan]
  );

  const hasEvents = events && events.events.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reaction Video
        </h1>
        <p className="text-gray-500">
          {reaction.recipientEmail}&apos;s reaction to a video from{" "}
          {reaction.senderEmail}
        </p>
      </div>

      {/* Player area — always PiP for watching */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        {hasEvents ? (
          <div className="relative w-full aspect-video bg-black">
            <div className="absolute inset-0">
              <YouTubePlayer
                ref={youtubeRef}
                videoUrl={reaction.videoUrl}
                controlledMode={true}
                onReady={() => setYoutubeReady(true)}
              />
            </div>
            <div className="absolute bottom-4 right-4 w-1/4 aspect-video rounded-xl overflow-hidden border-2 border-white/80 shadow-lg z-10">
              <video
                ref={webcamRef}
                src={reaction.recordingUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white/80 px-3 py-1 rounded-lg text-xs font-medium z-10">
              ReactionBooth
            </div>
          </div>
        ) : (
          <video
            ref={webcamRef}
            src={reaction.recordingUrl}
            controls
            className="w-full aspect-video bg-black"
          />
        )}
      </div>

      {hasEvents && (
        <p className="text-center text-xs text-gray-400 mb-6">
          Press play on the reaction video (bottom-right) to start synchronized
          playback.
        </p>
      )}

      {/* Download section */}
      <div className="flex flex-col items-center gap-4">
        {downloadState.status === "idle" && (
          <button
            onClick={handleDownloadClick}
            disabled={downloadUsed}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              downloadUsed
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {downloadUsed ? "Download Used" : "Download Composed Video"}
          </button>
        )}

        {/* Layout chooser */}
        {downloadState.status === "choosing" && (
          <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-md text-center">
            <h3 className="font-semibold text-gray-900 mb-1">
              Choose a layout
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Select how you want the final video composed.
            </p>
            <div className="flex flex-col gap-3">
              {availableLayouts.map((l) => (
                <button
                  key={l}
                  onClick={() => triggerCompose(l)}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                >
                  {l === "pip-desktop" ? (
                    <div className="w-16 h-10 bg-gray-800 rounded relative flex-shrink-0">
                      <div className="absolute bottom-0.5 right-0.5 w-4 h-3 bg-indigo-400 rounded-sm" />
                    </div>
                  ) : (
                    <div className="w-10 h-12 rounded flex flex-col flex-shrink-0 overflow-hidden">
                      <div className="flex-1 bg-gray-800" />
                      <div className="h-1 bg-indigo-500" />
                      <div className="flex-1 bg-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {LAYOUTS[l]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {l === "pip-desktop"
                        ? "YouTube large, webcam in corner"
                        : "YouTube top, webcam bottom"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setDownloadState({ status: "idle" })}
              className="text-sm text-gray-400 mt-3 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Compositing in progress */}
        {downloadState.status === "composing" && (
          <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">
              Composing your video...
            </h3>
            <p className="text-sm text-gray-500">
              Downloading YouTube source, syncing, and rendering the{" "}
              {LAYOUTS[downloadState.layout].toLowerCase()} layout. This may
              take a minute or two.
            </p>
          </div>
        )}

        {/* Ready to download */}
        {downloadState.status === "ready" && (
          <div className="bg-green-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Video ready!
            </h3>
            <a
              href={downloadState.url}
              download
              className="inline-block bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              Download .mp4
            </a>
          </div>
        )}

        {/* Error */}
        {downloadState.status === "error" && (
          <div className="bg-red-50 rounded-2xl p-6 w-full max-w-md text-center">
            <p className="text-red-600 font-medium mb-2">
              Compositing failed
            </p>
            <p className="text-sm text-red-500 mb-4">
              {downloadState.message}
            </p>
            <button
              onClick={() => setDownloadState({ status: "idle" })}
              className="text-sm text-red-400 hover:text-red-600"
            >
              Try again
            </button>
          </div>
        )}

        <a
          href="/create"
          className="text-gray-500 px-6 py-3 rounded-xl font-medium hover:text-gray-700 transition-colors"
        >
          Create Your Own Reaction
        </a>
      </div>

      {senderPlan === "free" && !downloadUsed && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Free tier: download link can only be used once.
        </p>
      )}

      {reaction.watermarked && (
        <p className="text-center text-xs text-gray-400 mt-6">
          This video includes a ReactionBooth watermark.{" "}
          <a
            href="/#pricing"
            className="text-indigo-400 hover:text-indigo-500"
          >
            Upgrade to Pro
          </a>{" "}
          for watermark-free reactions.
        </p>
      )}
    </div>
  );
}
