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
  | { status: "capturing" }
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
  const drawLoopRef = useRef<number>(0);
  const recordingAudioCtxRef = useRef<AudioContext | null>(null);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [downloadUsed, setDownloadUsed] = useState(
    senderPlan === "free" && reaction.downloadCount >= 1
  );
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

  const hasEvents = !!(events && events.events.length > 0);

  // --- Offscreen canvas HD recording (invisible to the user) ---
  const capturePreview = useCallback(async () => {
    const webcam = webcamRef.current;
    if (!webcam || downloadUsed) return;

    const isStackedLayout = selectedLayout === "stacked";
    // HD canvas: 1920×1080 for landscape layouts, 1080×1920 for stacked (portrait)
    const CW = isStackedLayout ? 1080 : 1920;
    const CH = isStackedLayout ? 1920 : 1080;

    // Create hidden canvas positioned off-screen
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    canvas.style.cssText =
      "position:fixed;top:-99999px;left:-99999px;width:1px;height:1px;pointer-events:none;opacity:0;";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;

    // Pixel positions that mirror the CSS layout percentages used in the preview
    const getPositions = () => {
      if (!hasEvents) {
        return { yt: null, wc: { x: 0, y: 0, w: CW, h: CH } };
      }
      if (selectedLayout.startsWith("pip-")) {
        const ytX = Math.round(0.03385 * CW);
        const ytY = Math.round(0.06019 * CH);
        const ytW = Math.round(0.77344 * CW);
        const ytH = Math.round(0.77315 * CH);
        const wcW = Math.round(0.35104 * CW);
        const wcH = Math.round((wcW * 9) / 16);
        const mx = Math.round(0.03385 * CW);
        const my = Math.round(0.06019 * CH);
        let wcX = 0, wcY = 0;
        if      (selectedLayout === "pip-bottom-right") { wcX = CW - mx - wcW; wcY = CH - my - wcH; }
        else if (selectedLayout === "pip-bottom-left")  { wcX = mx;            wcY = CH - my - wcH; }
        else if (selectedLayout === "pip-top-right")    { wcX = CW - mx - wcW; wcY = my; }
        else                                            { wcX = mx;            wcY = my; } // pip-top-left
        return { yt: { x: ytX, y: ytY, w: ytW, h: ytH }, wc: { x: wcX, y: wcY, w: wcW, h: wcH } };
      }
      if (selectedLayout === "side-by-side") {
        return {
          yt: { x: 0,                        y: Math.round(0.25 * CH), w: Math.round(0.48438 * CW), h: Math.round(0.5 * CH) },
          wc: { x: Math.round(0.51563 * CW), y: Math.round(0.25 * CH), w: Math.round(0.48438 * CW), h: Math.round(0.5 * CH) },
        };
      }
      // stacked
      const h = Math.round(0.47917 * CH);
      return {
        yt: { x: 0, y: 0,      w: CW, h },
        wc: { x: 0, y: CH - h, w: CW, h },
      };
    };

    const positions = getPositions();

    // Start loading the YouTube thumbnail (non-blocking — drawn once complete)
    let thumbImg: HTMLImageElement | null = null;
    if (hasEvents) {
      const vidId = reaction.videoUrl.match(
        /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/
      )?.[1];
      if (vidId) {
        thumbImg = new Image();
        // No crossOrigin attr — canvas.captureStream() is not restricted by taint
        thumbImg.src = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
        thumbImg.onerror = () => { thumbImg = null; };
      }
    }

    // Route webcam audio through Web Audio API so we can capture it independently
    // of the YouTube iframe (which is cross-origin and cannot be tapped).
    let audioDestTrack: MediaStreamTrack | null = null;
    try {
      const audioCtx = new AudioContext();
      recordingAudioCtxRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      const src  = audioCtx.createMediaElementSource(webcam);
      const gain = audioCtx.createGain();
      gain.gain.value = Math.min(wcVolume / 100, 2.0); // supports 0–200 %
      src.connect(gain);
      gain.connect(dest);
      gain.connect(audioCtx.destination); // keep audio audible during playback
      audioDestTrack = dest.stream.getAudioTracks()[0] ?? null;
    } catch {
      // AudioContext unavailable — record video-only
    }

    // Build MediaStream: canvas video track + optional webcam audio track
    const canvasStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (audioDestTrack) tracks.push(audioDestTrack);
    const combinedStream = new MediaStream(tracks);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000, // 8 Mbps → crisp 1080p
    });
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const cleanup = () => {
      cancelAnimationFrame(drawLoopRef.current);
      drawLoopRef.current = 0;
      if (canvas.parentNode) document.body.removeChild(canvas);
      combinedStream.getTracks().forEach((t) => t.stop());
      recordingAudioCtxRef.current?.close().catch(() => {});
      recordingAudioCtxRef.current = null;
      captureMediaRecorderRef.current = null;
      captureStreamRef.current = null;
    };

    mediaRecorder.onstop = () => {
      cleanup();
      if (senderPlan === "free") setDownloadUsed(true);
      const blob = new Blob(chunks, { type: mimeType });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `reaction-${reaction.id}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setDownloadState({ status: "idle" });
    };

    captureMediaRecorderRef.current = mediaRecorder;
    captureStreamRef.current = combinedStream;

    // ── Draw loop — runs entirely off-screen at 30 fps ──────────────────────
    const drawFrame = () => {
      // Black background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CW, CH);

      // YouTube content area
      if (hasEvents && positions.yt) {
        const { x, y, w, h } = positions.yt;
        if (thumbImg && thumbImg.complete && thumbImg.naturalWidth > 0) {
          try { ctx.drawImage(thumbImg, x, y, w, h); } catch { /* taint guard */ }
          // Semi-transparent overlay so it reads as "source video"
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.fillRect(x, y, w, h);
        } else {
          ctx.fillStyle = "#111827";
          ctx.fillRect(x, y, w, h);
        }
      }

      // Webcam video
      if (webcam.readyState >= 2 /* HAVE_CURRENT_DATA */) {
        try {
          ctx.drawImage(webcam, positions.wc.x, positions.wc.y, positions.wc.w, positions.wc.h);
        } catch { /* skip frame on error */ }
      }

      // Watermark (mirrors CSS logic)
      if (reaction.watermarked) {
        const fs = Math.max(13, Math.round(CW * 0.007));
        ctx.save();
        ctx.font         = `500 ${fs}px system-ui, sans-serif`;
        ctx.fillStyle    = "rgba(255,255,255,0.65)";
        ctx.textBaseline = "bottom";
        const pad = Math.round(CW * 0.008);
        ctx.fillText(
          "ReactionBooth",
          positions.wc.x + pad,
          positions.wc.y + positions.wc.h - pad
        );
        ctx.restore();
      }

      drawLoopRef.current = requestAnimationFrame(drawFrame);
    };

    // Reset playhead, enter capturing state, then kick off recording + playback
    webcam.currentTime = 0;
    setDownloadState({ status: "capturing" });
    // Brief pause so the webcam element settles before we start drawing
    await new Promise<void>((r) => setTimeout(r, 200));

    drawLoopRef.current = requestAnimationFrame(drawFrame);
    mediaRecorder.start(1000);
    // Existing sync mechanism drives YouTube in sync once webcam plays
    webcam.play();

    const onEnded = () => {
      if (captureMediaRecorderRef.current?.state !== "inactive") {
        captureMediaRecorderRef.current?.stop();
      }
      webcam.removeEventListener("ended", onEnded);
    };
    webcam.addEventListener("ended", onEnded);
  }, [
    downloadUsed,
    hasEvents,
    reaction.id,
    reaction.videoUrl,
    reaction.watermarked,
    selectedLayout,
    senderPlan,
    wcVolume,
  ]);

  const stopCapture = useCallback(() => {
    webcamRef.current?.pause();
    cancelAnimationFrame(drawLoopRef.current);
    if (captureMediaRecorderRef.current?.state !== "inactive") {
      captureMediaRecorderRef.current?.stop();
    }
  }, []);

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
            <button
              onClick={capturePreview}
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
                ? `Record as ${LAYOUTS[selectedLayout]}`
                : "Save Reaction Video"}
            </button>
            {!downloadUsed && (
              <p className="text-xs text-gray-400">
                Records the reaction video in your browser at 1080p HD — no uploads or screen sharing required.
              </p>
            )}
          </div>
        )}

        {downloadState.status === "capturing" && (
          <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-gray-900">Recording in HD…</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              The reaction is being recorded at 1080p in the background. It will download automatically when playback finishes.
            </p>
            <button
              onClick={stopCapture}
              className="text-sm text-gray-500 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Stop &amp; save now
            </button>
          </div>
        )}

        {downloadState.status === "error" && (
          <div className="bg-red-50 rounded-2xl p-6 w-full max-w-md text-center">
            <p className="text-red-600 font-medium mb-2">Recording failed</p>
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
