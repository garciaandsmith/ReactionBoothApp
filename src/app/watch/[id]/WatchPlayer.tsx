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
  | { status: "capturing" }
  | { status: "ready"; url: string }
  | { status: "error"; message: string };

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function WatchPlayer({
  reaction,
  events,
  senderPlan,
  availableLayouts,
}: WatchPlayerProps) {
  const youtubeRef = useRef<YouTubePlayerHandle>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const syncFrameRef = useRef<number>(0);
  const captureMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [hasDisplayMedia, setHasDisplayMedia] = useState(false);
  const [downloadUsed, setDownloadUsed] = useState(
    senderPlan === "free" && reaction.downloadCount >= 1
  );

  useEffect(() => {
    setHasDisplayMedia(!!navigator.mediaDevices?.getDisplayMedia);
  }, []);
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: "idle",
  });

  // Custom player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Layout / volume state
  const [selectedLayout, setSelectedLayout] = useState<WatchLayout>(
    availableLayouts[0] ?? "pip-bottom-right"
  );
  const [ytVolume, setYtVolume] = useState(100);
  const [wcVolume, setWcVolume] = useState(100);

  // Live volume control
  useEffect(() => {
    youtubeRef.current?.setVolume(Math.min(ytVolume, 100));
  }, [ytVolume, youtubeReady]);

  useEffect(() => {
    if (webcamRef.current) {
      webcamRef.current.volume = Math.min(wcVolume / 100, 1.0);
    }
  }, [wcVolume]);

  // Progress ticker
  useEffect(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;
    let raf: number;
    const tick = () => {
      if (!isSeeking) setCurrentTime(webcam.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isSeeking]);

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
    const onLoadedMetadata = () => {
      setDuration(webcam.duration);
    };

    webcam.addEventListener("play", onPlay);
    webcam.addEventListener("pause", onPause);
    webcam.addEventListener("seeked", onSeeked);
    webcam.addEventListener("ended", onEnded);
    webcam.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      webcam.removeEventListener("play", onPlay);
      webcam.removeEventListener("pause", onPause);
      webcam.removeEventListener("seeked", onSeeked);
      webcam.removeEventListener("ended", onEnded);
      webcam.removeEventListener("loadedmetadata", onLoadedMetadata);
      stopSyncLoop();
    };
  }, [events, syncYouTubeToWebcam, startSyncLoop, stopSyncLoop]);

  // No-events case: still track play/pause for the standalone video
  useEffect(() => {
    const webcam = webcamRef.current;
    if (!webcam || events) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onLoadedMetadata = () => setDuration(webcam.duration);
    webcam.addEventListener("play", onPlay);
    webcam.addEventListener("pause", onPause);
    webcam.addEventListener("ended", onEnded);
    webcam.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      webcam.removeEventListener("play", onPlay);
      webcam.removeEventListener("pause", onPause);
      webcam.removeEventListener("ended", onEnded);
      webcam.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [events]);

  // Unified play/pause toggle
  const togglePlay = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;
    if (webcam.paused) {
      webcam.play();
    } else {
      webcam.pause();
    }
  }, []);

  // Seek via the progress bar
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (webcamRef.current) webcamRef.current.currentTime = t;
  }, []);

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

  // --- Browser capture ---
  const capturePreview = useCallback(async () => {
    if (!webcamRef.current) return;

    // Request tab capture. preferCurrentTab is Chrome-only (not in TS types).
    let stream: MediaStream;
    try {
      stream = await (navigator.mediaDevices.getDisplayMedia as (
        c: Record<string, unknown>
      ) => Promise<MediaStream>)({
        video: { frameRate: { ideal: 30 } },
        audio: true,
        preferCurrentTab: true,
      });
    } catch {
      // User cancelled the share dialog — stay idle.
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      captureMediaRecorderRef.current = null;
      captureStreamRef.current = null;

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reaction-${reaction.id}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setDownloadState({ status: "idle" });
    };

    // If the user closes the browser's "Stop sharing" bar, treat it as a stop.
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        webcamRef.current?.pause();
        if (captureMediaRecorderRef.current?.state !== "inactive") {
          captureMediaRecorderRef.current?.stop();
        }
      };
    });

    captureMediaRecorderRef.current = mediaRecorder;
    captureStreamRef.current = stream;

    // Reset playhead, enter capturing state, then start recording + playback.
    webcamRef.current.currentTime = 0;
    setDownloadState({ status: "capturing" });
    // Small delay so the tab renders the reset state before recording starts.
    await new Promise<void>((r) => setTimeout(r, 300));
    mediaRecorder.start(1000);
    // Existing sync mechanism takes over once webcam plays.
    webcamRef.current.play();

    // Stop recording when playback reaches the end.
    const onWebcamEnded = () => {
      if (captureMediaRecorderRef.current?.state !== "inactive") {
        captureMediaRecorderRef.current?.stop();
      }
      webcamRef.current?.removeEventListener("ended", onWebcamEnded);
    };
    webcamRef.current.addEventListener("ended", onWebcamEnded);
  }, [reaction.id]);

  const stopCapture = useCallback(() => {
    webcamRef.current?.pause();
    if (captureMediaRecorderRef.current?.state !== "inactive") {
      captureMediaRecorderRef.current?.stop();
    }
  }, []);

  const hasEvents = events && events.events.length > 0;
  const isPip = selectedLayout.startsWith("pip-");
  const isStacked = selectedLayout === "stacked";

  const getPreviewContainerStyle = (): React.CSSProperties => {
    if (isStacked) {
      return {
        backgroundColor: "#2EE6A6",
        aspectRatio: "9/16",
        height: "calc(100vh - 14rem)",
      };
    }
    return {
      backgroundColor: "#2EE6A6",
      aspectRatio: "16/9",
    };
  };

  const getYouTubeContainerStyle = (): React.CSSProperties => {
    if (!hasEvents) return { display: "none" };
    if (isPip) {
      return {
        position: "absolute",
        left: "3.385%",
        top: "6.019%",
        width: "77.344%",
        height: "77.315%",
        overflow: "hidden",
      };
    }
    if (selectedLayout === "side-by-side") {
      return {
        position: "absolute",
        left: 0,
        top: "25%",
        width: "48.438%",
        height: "50%",
        overflow: "hidden",
      };
    }
    return {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "47.917%",
      overflow: "hidden",
    };
  };

  const getWebcamContainerStyle = (): React.CSSProperties => {
    if (isPip) {
      const base: React.CSSProperties = {
        position: "absolute",
        width: "35.104%",
        aspectRatio: "16/9",
        overflow: "hidden",
        zIndex: 10,
      };
      const margin = "3.385%";
      const vMargin = "6.019%";
      switch (selectedLayout) {
        case "pip-bottom-right": return { ...base, right: margin, bottom: vMargin };
        case "pip-bottom-left":  return { ...base, left: margin,  bottom: vMargin };
        case "pip-top-right":    return { ...base, right: margin, top: vMargin };
        case "pip-top-left":     return { ...base, left: margin,  top: vMargin };
        default:                 return { ...base, right: margin, bottom: vMargin };
      }
    }
    if (selectedLayout === "side-by-side") {
      return {
        position: "absolute",
        left: "51.563%",
        top: "25%",
        width: "48.438%",
        height: "50%",
        overflow: "hidden",
      };
    }
    return {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: "47.917%",
      overflow: "hidden",
    };
  };

  const getWatermarkStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      color: "white",
      fontSize: "clamp(8px, 1vw, 13px)",
      fontWeight: 500,
      opacity: 0.65,
      pointerEvents: "none",
      letterSpacing: "0.04em",
      zIndex: 20,
    };
    if (isStacked) return { ...base, top: "49.6%", left: "50%", transform: "translate(-50%, -50%)" };
    if (selectedLayout === "side-by-side") return { ...base, bottom: "3%", left: "50%", transform: "translateX(-50%)" };
    return { ...base, bottom: "1.5%", left: "1.5%" };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reaction Video</h1>
        <p className="text-gray-500">
          {reaction.recipientEmail}&apos;s reaction to a video from {reaction.senderEmail}
        </p>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-2">
        {hasEvents ? (
          <div className={isStacked ? "flex justify-center bg-black" : ""}>
            <div className="relative overflow-hidden" style={getPreviewContainerStyle()}>
              <div style={getYouTubeContainerStyle()}>
                <YouTubePlayer
                  ref={youtubeRef}
                  videoUrl={reaction.videoUrl}
                  controlledMode={true}
                  onReady={() => setYoutubeReady(true)}
                  className="relative w-full h-full bg-black overflow-hidden"
                />
              </div>

              <div style={getWebcamContainerStyle()}>
                {/* No mirror (scaleX removed), no native controls */}
                <video
                  ref={webcamRef}
                  src={reaction.recordingUrl}
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {reaction.watermarked && (
                <span style={getWatermarkStyle()}>ReactionBooth</span>
              )}
            </div>
          </div>
        ) : (
          /* No event log — single webcam video, no mirror, no native controls */
          <div className="relative">
            <video
              ref={webcamRef}
              src={reaction.recordingUrl}
              playsInline
              className="w-full aspect-video bg-black"
            />
          </div>
        )}
      </div>

      {/* ── Unified player bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-6 flex flex-col gap-2">
        {/* Progress scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onMouseDown={() => setIsSeeking(true)}
            onMouseUp={() => setIsSeeking(false)}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand"
          />
          <span className="text-xs text-gray-400 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-brand hover:bg-brand-600 text-soft-black rounded-full transition-colors flex-shrink-0"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* Volume sliders (compact) */}
          {hasEvents && (
            <div className="flex items-center gap-4 flex-1 ml-4">
              <CompactVolume
                icon="yt"
                label="YouTube"
                value={ytVolume}
                onChange={setYtVolume}
              />
              <CompactVolume
                icon="cam"
                label="Webcam"
                value={wcVolume}
                onChange={setWcVolume}
              />
            </div>
          )}
          {!hasEvents && (
            <div className="flex items-center gap-2 ml-4">
              <CompactVolume
                icon="cam"
                label="Volume"
                value={wcVolume}
                onChange={(v) => {
                  setWcVolume(v);
                  if (webcamRef.current) webcamRef.current.volume = Math.min(v / 100, 1.0);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {hasEvents && (
        <p className="text-center text-xs text-gray-400 mb-6">
          Press play above to start synchronized playback. Adjust layout and volume — the preview updates live.
        </p>
      )}

      {/* Layout chooser */}
      {hasEvents && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Layout</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {availableLayouts.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLayout(l)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                  selectedLayout === l
                    ? "border-brand bg-brand-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <LayoutIcon layout={l} active={selectedLayout === l} />
                <span
                  className={`text-[10px] leading-tight text-center ${
                    selectedLayout === l ? "text-brand-700 font-semibold" : "text-gray-500"
                  }`}
                >
                  {LAYOUTS[l]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Download */}
      <div className="flex flex-col items-center gap-4">
        {downloadState.status === "idle" && (
          <div className="flex flex-col items-center gap-2">
            {hasDisplayMedia && hasEvents ? (
              <>
                <button
                  onClick={capturePreview}
                  disabled={downloadUsed}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                    downloadUsed
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-brand text-soft-black hover:bg-brand-600"
                  }`}
                >
                  {downloadUsed ? "Download Used" : `Record as ${LAYOUTS[selectedLayout]}`}
                </button>
                {!downloadUsed && (
                  <p className="text-xs text-gray-400">
                    Plays back the preview in your browser and captures it — no server upload needed.
                  </p>
                )}
              </>
            ) : (
              <button
                onClick={triggerCompose}
                disabled={downloadUsed}
                className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                  downloadUsed
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-brand text-soft-black hover:bg-brand-600"
                }`}
              >
                {downloadUsed
                  ? "Download Used"
                  : hasEvents
                  ? `Download as ${LAYOUTS[selectedLayout]}`
                  : "Download Video"}
              </button>
            )}
          </div>
        )}

        {downloadState.status === "capturing" && (
          <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-gray-900">Recording preview…</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              The preview is playing and being captured. It will download automatically when it finishes.
            </p>
            <button
              onClick={stopCapture}
              className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Stop &amp; save now
            </button>
          </div>
        )}

        {downloadState.status === "composing" && (
          <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="w-12 h-12 border-4 border-brand-100 border-t-brand rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">Composing your video...</h3>
            <p className="text-sm text-gray-500">
              Downloading YouTube source, syncing, and rendering the{" "}
              {LAYOUTS[selectedLayout].toLowerCase()} layout. This may take a minute or two.
            </p>
          </div>
        )}

        {downloadState.status === "ready" && (
          <div className="bg-green-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-3">Video ready!</h3>
            <a href={downloadState.url} download className="inline-block bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">
              Download .mp4
            </a>
          </div>
        )}

        {downloadState.status === "error" && (
          <div className="bg-red-50 rounded-2xl p-6 w-full max-w-md text-center">
            <p className="text-red-600 font-medium mb-2">Compositing failed</p>
            <p className="text-sm text-red-500 mb-4">{downloadState.message}</p>
            <button onClick={() => setDownloadState({ status: "idle" })} className="text-sm text-red-400 hover:text-red-600">
              Try again
            </button>
          </div>
        )}

        <a href="/create" className="text-gray-500 px-6 py-3 rounded-xl font-medium hover:text-gray-700 transition-colors">
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
          <a href="/#pricing" className="text-brand hover:text-brand-600">Upgrade to Pro</a>{" "}
          for watermark-free reactions.
        </p>
      )}
    </div>
  );
}

// --- Compact volume slider ---
function CompactVolume({
  icon,
  label,
  value,
  onChange,
}: {
  icon: "yt" | "cam";
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        {icon === "yt" ? (
          <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>
        ) : (
          <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>
        )}
      </svg>
      <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>
      <input
        type="range"
        min={0}
        max={200}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand min-w-0"
      />
      <span className="text-xs text-gray-400 tabular-nums w-9 text-right">{value}%</span>
    </div>
  );
}

// --- Layout icon thumbnails ---
function LayoutIcon({ layout, active }: { layout: WatchLayout; active: boolean }) {
  const bg = active ? "bg-brand" : "bg-gray-600";
  const fg = active ? "bg-brand-400" : "bg-gray-400";

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

  return (
    <div className="w-12 h-8 rounded flex flex-col overflow-hidden gap-px">
      <div className={`flex-1 ${bg}`} />
      <div className="h-0.5 bg-brand" />
      <div className={`flex-1 ${fg}`} />
    </div>
  );
}
