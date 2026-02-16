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

export default function WatchPlayer({
  reaction,
  events,
  senderPlan,
}: WatchPlayerProps) {
  const youtubeRef = useRef<YouTubePlayerHandle>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const syncFrameRef = useRef<number>(0);
  const [layout, setLayout] = useState<WatchLayout>(
    (reaction.selectedLayout as WatchLayout) || "pip-desktop"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [downloadUsed, setDownloadUsed] = useState(
    senderPlan === "free" && reaction.downloadCount >= 1
  );

  const availableLayouts =
    senderPlan === "pro"
      ? (["pip-desktop", "stacked-mobile"] as const)
      : (["pip-desktop"] as const);

  // Sync YouTube playback to webcam video position using event log
  const syncYouTubeToWebcam = useCallback(() => {
    if (!youtubeRef.current || !webcamRef.current || !events) return;

    const webcamTimeMs = webcamRef.current.currentTime * 1000;

    // Find the last relevant events before current webcam time
    let lastPlayEvent: (typeof events.events)[number] | null = null;
    let lastPauseOrEnd: (typeof events.events)[number] | null = null;

    for (const event of events.events) {
      if (event.timestampMs > webcamTimeMs) break;
      if (event.type === "play") lastPlayEvent = event;
      if (event.type === "pause" || event.type === "ended")
        lastPauseOrEnd = event;
    }

    // Determine if YouTube should be playing
    const shouldBePlaying =
      lastPlayEvent &&
      (!lastPauseOrEnd ||
        lastPlayEvent.timestampMs > lastPauseOrEnd.timestampMs);

    if (shouldBePlaying && lastPlayEvent) {
      // Calculate where YouTube should be
      const elapsedSincePlay = webcamTimeMs - lastPlayEvent.timestampMs;
      const expectedYtTime =
        lastPlayEvent.videoTimeS + elapsedSincePlay / 1000;

      const actualYtTime = youtubeRef.current.getCurrentTime();
      const drift = Math.abs(actualYtTime - expectedYtTime);

      // Only seek if drift is significant (avoids jitter)
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

  // Start/stop sync loop
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

  // Wire up webcam video events to control sync
  useEffect(() => {
    const webcam = webcamRef.current;
    if (!webcam || !events) return;

    const onPlay = () => {
      setIsPlaying(true);
      syncYouTubeToWebcam();
      startSyncLoop();
    };
    const onPause = () => {
      setIsPlaying(false);
      youtubeRef.current?.pause();
      stopSyncLoop();
    };
    const onSeeked = () => {
      syncYouTubeToWebcam();
    };
    const onEnded = () => {
      setIsPlaying(false);
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

  // Persist layout selection
  const handleLayoutChange = useCallback(
    (newLayout: WatchLayout) => {
      setLayout(newLayout);
      fetch(`/api/reactions/${reaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedLayout: newLayout }),
      }).catch(() => {});
    },
    [reaction.id]
  );

  const handleDownload = useCallback(async () => {
    if (downloadUsed) return;

    // Open the download URL
    window.open(`/api/reactions/${reaction.id}/download`, "_blank");

    if (senderPlan === "free") {
      setDownloadUsed(true);
    }
  }, [reaction.id, senderPlan, downloadUsed]);

  // Fallback: no events means we just show webcam-only playback
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

      {/* Layout selector */}
      {hasEvents && availableLayouts.length > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          {availableLayouts.map((l) => (
            <button
              key={l}
              onClick={() => handleLayoutChange(l)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                layout === l
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {LAYOUTS[l]}
            </button>
          ))}
        </div>
      )}

      {/* Player area */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        {hasEvents ? (
          <>
            {layout === "pip-desktop" && (
              <div className="relative w-full aspect-video bg-black">
                {/* YouTube fills the area */}
                <div className="absolute inset-0">
                  <YouTubePlayer
                    ref={youtubeRef}
                    videoUrl={reaction.videoUrl}
                    controlledMode={true}
                    onReady={() => setYoutubeReady(true)}
                  />
                </div>
                {/* Webcam PiP in bottom-right */}
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
                {/* ReactionBooth branding */}
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm text-white/80 px-3 py-1 rounded-lg text-xs font-medium z-10">
                  ReactionBooth
                </div>
              </div>
            )}

            {layout === "stacked-mobile" && (
              <div className="max-w-lg mx-auto">
                {/* YouTube on top */}
                <div className="aspect-video w-full">
                  <YouTubePlayer
                    ref={youtubeRef}
                    videoUrl={reaction.videoUrl}
                    controlledMode={true}
                    onReady={() => setYoutubeReady(true)}
                  />
                </div>
                {/* Branding bar */}
                <div className="bg-indigo-500 text-white text-center py-2 text-sm font-medium">
                  ReactionBooth
                </div>
                {/* Webcam on bottom */}
                <div className="aspect-video w-full">
                  <video
                    ref={webcamRef}
                    src={reaction.recordingUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover bg-black"
                    style={{ transform: "scaleX(-1)" }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Fallback: webcam-only (no event data) */
          <video
            ref={webcamRef}
            src={reaction.recordingUrl}
            controls
            className="w-full aspect-video bg-black"
          />
        )}
      </div>

      {/* Playback hint */}
      {hasEvents && (
        <p className="text-center text-xs text-gray-400 mb-6">
          Press play on the reaction video (bottom-right) to start synchronized
          playback.
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleDownload}
          disabled={downloadUsed}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            downloadUsed
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-indigo-500 text-white hover:bg-indigo-600"
          }`}
        >
          {downloadUsed ? "Download Used" : "Download Reaction"}
        </button>
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
