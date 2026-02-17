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
  availableLayouts: WatchLayout[];
}

type DownloadState =
  | { status: "idle" }
  | { status: "composing" }
  | { status: "ready"; url: string }
  | { status: "error"; message: string };

export default function WatchPlayer({
  reaction,
  events,
  senderPlan,
  availableLayouts,
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

  // Live preview state
  const [selectedLayout, setSelectedLayout] = useState<WatchLayout>(
    availableLayouts[0] ?? "pip-bottom-right"
  );
  const [ytVolume, setYtVolume] = useState(100);
  const [wcVolume, setWcVolume] = useState(100);

  // --- Live volume control ---
  useEffect(() => {
    // YouTube API volume is 0-100; our slider is 0-200
    youtubeRef.current?.setVolume(Math.min(ytVolume, 100));
  }, [ytVolume, youtubeReady]);

  useEffect(() => {
    if (webcamRef.current) {
      // HTML5 video.volume is 0.0-1.0; our slider is 0-200
      webcamRef.current.volume = Math.min(wcVolume / 100, 1.0);
    }
  }, [wcVolume]);

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

  // --- Download with compositing ---
  const triggerCompose = useCallback(async () => {
    if (downloadUsed) return;

    if (!events || events.events.length === 0) {
      window.open(`/api/reactions/${reaction.id}/download`, "_blank");
      if (senderPlan === "free") setDownloadUsed(true);
      return;
    }

    setDownloadState({ status: "composing" });

    try {
      const res = await fetch(`/api/reactions/${reaction.id}/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout: selectedLayout,
          youtubeVolume: ytVolume,
          webcamVolume: wcVolume,
        }),
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

      if (senderPlan === "free") {
        setDownloadUsed(true);
      }
    } catch {
      setDownloadState({
        status: "error",
        message: "Network error. Please try again.",
      });
    }
  }, [downloadUsed, events, reaction.id, senderPlan, selectedLayout, ytVolume, wcVolume]);

  const hasEvents = events && events.events.length > 0;
  const isPip = selectedLayout.startsWith("pip-");

  // --- Dynamic layout styles (no remount — same elements, different CSS) ---
  const getYouTubeContainerStyle = (): React.CSSProperties => {
    if (!hasEvents) return { display: "none" };

    if (isPip) {
      return { position: "absolute", inset: 0 };
    }
    if (selectedLayout === "side-by-side") {
      return { flex: 1, minWidth: 0 };
    }
    // stacked
    return { width: "100%" };
  };

  const getWebcamContainerStyle = (): React.CSSProperties => {
    if (isPip) {
      const posStyles: Record<string, React.CSSProperties> = {
        "pip-bottom-right": { bottom: 16, right: 16 },
        "pip-bottom-left": { bottom: 16, left: 16 },
        "pip-top-right": { top: 16, right: 16 },
        "pip-top-left": { top: 16, left: 16 },
      };
      return {
        position: "absolute",
        width: "25%",
        aspectRatio: "16/9",
        borderRadius: 12,
        overflow: "hidden",
        border: "2px solid rgba(255,255,255,0.8)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 10,
        ...posStyles[selectedLayout],
      };
    }
    if (selectedLayout === "side-by-side") {
      return { flex: 1, minWidth: 0 };
    }
    // stacked
    return { width: "100%" };
  };

  const getPreviewContainerClassName = () => {
    if (isPip) return "relative w-full aspect-video bg-black";
    if (selectedLayout === "side-by-side") return "w-full bg-black flex flex-row";
    return "w-full bg-black flex flex-col";
  };

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

      {/* Preview area — single set of elements, CSS-driven layout switching */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-2">
        {hasEvents ? (
          <>
            <div className={getPreviewContainerClassName()}>
              <div style={getYouTubeContainerStyle()} className={!isPip && selectedLayout !== "side-by-side" ? "aspect-video" : undefined}>
                <YouTubePlayer
                  ref={youtubeRef}
                  videoUrl={reaction.videoUrl}
                  controlledMode={true}
                  onReady={() => setYoutubeReady(true)}
                />
              </div>
              <div style={getWebcamContainerStyle()} className={!isPip ? "aspect-video" : undefined}>
                <video
                  ref={webcamRef}
                  src={reaction.recordingUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              </div>
            </div>
            {/* Brand bar preview */}
            <div
              className="flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: "#6366f1", height: 36 }}
            >
              ReactionBooth
            </div>
          </>
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
          Press play on the reaction video to start synchronized playback.
          Adjust layout and volume below — the preview updates live.
        </p>
      )}

      {/* Controls panel — always visible when there are events */}
      {hasEvents && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-8">
          {/* Layout chooser */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Layout
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {availableLayouts.map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLayout(l)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                    selectedLayout === l
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <LayoutIcon layout={l} active={selectedLayout === l} />
                  <span
                    className={`text-[10px] leading-tight text-center ${
                      selectedLayout === l
                        ? "text-indigo-700 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {LAYOUTS[l]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Volume sliders */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Volume</h3>
            <VolumeSlider
              label="YouTube Audio"
              value={ytVolume}
              onChange={setYtVolume}
            />
            <VolumeSlider
              label="Webcam / Mic"
              value={wcVolume}
              onChange={setWcVolume}
            />
          </div>
        </div>
      )}

      {/* Download section */}
      <div className="flex flex-col items-center gap-4">
        {downloadState.status === "idle" && (
          <button
            onClick={triggerCompose}
            disabled={downloadUsed}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              downloadUsed
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600"
            }`}
          >
            {downloadUsed
              ? "Download Used"
              : hasEvents
              ? `Download as ${LAYOUTS[selectedLayout]}`
              : "Download Video"}
          </button>
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
              {LAYOUTS[selectedLayout].toLowerCase()} layout with your volume
              settings. This may take a minute or two.
            </p>
          </div>
        )}

        {/* Ready to download */}
        {downloadState.status === "ready" && (
          <div className="bg-green-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
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
            <h3 className="font-semibold text-gray-900 mb-3">Video ready!</h3>
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
            <p className="text-red-600 font-medium mb-2">Compositing failed</p>
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

// --- Layout icon thumbnails ---

function LayoutIcon({
  layout,
  active,
}: {
  layout: WatchLayout;
  active: boolean;
}) {
  const bg = active ? "bg-indigo-400" : "bg-gray-600";
  const fg = active ? "bg-indigo-300" : "bg-gray-400";

  if (layout.startsWith("pip-")) {
    const posMap: Record<string, string> = {
      "pip-bottom-right": "bottom-0.5 right-0.5",
      "pip-bottom-left": "bottom-0.5 left-0.5",
      "pip-top-right": "top-0.5 right-0.5",
      "pip-top-left": "top-0.5 left-0.5",
    };
    const pos = posMap[layout] ?? "bottom-0.5 right-0.5";
    return (
      <div className={`w-12 h-8 ${bg} rounded relative`}>
        <div className={`absolute ${pos} w-4 h-3 ${fg} rounded-sm`} />
      </div>
    );
  }

  if (layout === "side-by-side") {
    return (
      <div className="w-12 h-8 rounded flex overflow-hidden gap-px">
        <div className={`flex-1 ${bg}`} />
        <div className={`flex-1 ${fg}`} />
      </div>
    );
  }

  // stacked
  return (
    <div className="w-12 h-8 rounded flex flex-col overflow-hidden gap-px">
      <div className={`flex-1 ${bg}`} />
      <div className="h-0.5 bg-indigo-500" />
      <div className={`flex-1 ${fg}`} />
    </div>
  );
}

// --- Volume slider ---

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600 w-28 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={200}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
      <span className="text-sm text-gray-500 w-12 text-right tabular-nums">
        {value}%
      </span>
    </div>
  );
}
