"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import YouTubePlayer, { YouTubePlayerHandle } from "@/components/YouTubePlayer";
import type { ReactionEventLog, WatchLayout } from "@/lib/types";
import { LAYOUTS } from "@/lib/constants";

// MediaStreamTrackProcessor is a WebCodecs API not yet in TypeScript's lib.dom.d.ts
declare class MediaStreamTrackProcessor<T extends MediaStreamTrack = MediaStreamTrack> {
  constructor(init: { track: MediaStreamTrack });
  readonly readable: ReadableStream<T extends AudioStreamTrack ? AudioData : VideoFrame>;
}
// Narrower alias used in this file
type AudioStreamTrack = MediaStreamTrack;

interface WatchPlayerProps {
  reaction: {
    id: string;
    videoUrl: string;
    recordingUrl: string;
    senderEmail: string;
    recipientEmail: string;
    requesterName: string | null;
    recipientName: string | null;
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
  | { status: "compositing" }   // server-side FFmpeg compose in progress
  | { status: "capturing" }     // offscreen-canvas fallback (webcam-only)
  | { status: "error"; message: string };

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s) || s < 0) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Logo aspect ratio from the SVG viewBox (1509.84 × 267.93)
const LOGO_ASPECT = 1509.84 / 267.93;

// New PIP layout dimensions (canvas pixels for 1920×1080)
// Main video: 1750×977, offset 85px left, 75px top
// PIP video:  550×310, flush to canvas corner
const PIP = {
  mainX: 85, mainY: 75, mainW: 1750, mainH: 977,
  pipW: 550,  pipH: 310,
};

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
  // Holds an async stop function that finalises whichever recording path is active.
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const [youtubeReady, setYoutubeReady] = useState(false);
  const [downloadUsed, setDownloadUsed] = useState(
    senderPlan === "free" && reaction.downloadCount >= 1
  );
  const [downloadState, setDownloadState] = useState<DownloadState>({ status: "idle" });
  const [recordingProgress, setRecordingProgress] = useState(0);


  // Custom player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Use ref for isSeeking to avoid stale closure in RAF callbacks
  const isSeekingRef = useRef(false);

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

  // Progress ticker — runs continuously; isSeekingRef prevents overwriting slider value
  useEffect(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;
    let raf: number;
    const tick = () => {
      if (!isSeekingRef.current) setCurrentTime(webcam.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- Synchronized playback ---
  const syncYouTubeToWebcam = useCallback(() => {
    if (!youtubeRef.current || !webcamRef.current || !events) return;

    const webcamTimeMs = webcamRef.current.currentTime * 1000;

    let lastPlayEvent: (typeof events.events)[number] | null = null;
    let lastPauseOrEnd: (typeof events.events)[number] | null = null;

    for (const event of events.events) {
      if (event.timestampMs > webcamTimeMs) break;
      if (event.type === "play") lastPlayEvent = event;
      if (event.type === "pause" || event.type === "ended") lastPauseOrEnd = event;
    }

    const shouldBePlaying =
      lastPlayEvent &&
      (!lastPauseOrEnd || lastPlayEvent.timestampMs > lastPauseOrEnd.timestampMs);

    if (shouldBePlaying && lastPlayEvent) {
      const elapsedSincePlay = webcamTimeMs - lastPlayEvent.timestampMs;
      const expectedYtTime = lastPlayEvent.videoTimeS + elapsedSincePlay / 1000;
      const actualYtTime = youtubeRef.current.getCurrentTime();
      if (Math.abs(actualYtTime - expectedYtTime) > 0.5) {
        youtubeRef.current.seekTo(expectedYtTime);
      }
      if (youtubeRef.current.getPlayerState() !== 1) youtubeRef.current.play();
    } else {
      if (youtubeRef.current.getPlayerState() === 1) youtubeRef.current.pause();
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
    const onPlay  = () => { setIsPlaying(true);  syncYouTubeToWebcam(); startSyncLoop(); };
    const onPause = () => { setIsPlaying(false); youtubeRef.current?.pause(); stopSyncLoop(); };
    const onSeeked = () => syncYouTubeToWebcam();
    const onEnded  = () => { setIsPlaying(false); youtubeRef.current?.pause(); stopSyncLoop(); };
    const onLoadedMetadata = () => {
      const d = webcam.duration;
      setDuration(isFinite(d) && d > 0 ? d : 0);
    };
    webcam.addEventListener("play",  onPlay);
    webcam.addEventListener("pause", onPause);
    webcam.addEventListener("seeked", onSeeked);
    webcam.addEventListener("ended", onEnded);
    webcam.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      webcam.removeEventListener("play",  onPlay);
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
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onLoadedMetadata = () => {
      const d = webcam.duration;
      setDuration(isFinite(d) && d > 0 ? d : 0);
    };
    webcam.addEventListener("play",  onPlay);
    webcam.addEventListener("pause", onPause);
    webcam.addEventListener("ended", onEnded);
    webcam.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      webcam.removeEventListener("play",  onPlay);
      webcam.removeEventListener("pause", onPause);
      webcam.removeEventListener("ended", onEnded);
      webcam.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [events]);

  // Unified play/pause toggle
  const togglePlay = useCallback(() => {
    const webcam = webcamRef.current;
    if (!webcam) return;
    if (webcam.paused) webcam.play(); else webcam.pause();
  }, []);

  // Seek via the progress bar
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (webcamRef.current) webcamRef.current.currentTime = t;
  }, []);

  const hasEvents = !!(events && events.events.length > 0);

  // ── Offscreen-canvas HD recording ──────────────────────────────────────
  //
  // Produces a true .mp4 on Chrome 94+ via WebCodecs (VideoEncoder +
  // AudioEncoder + mp4-muxer). Falls back to MediaRecorder for other
  // browsers (Safari returns .mp4 natively; others get .webm).
  //
  // The recording happens entirely off-screen: a hidden 1920×1080 canvas
  // is rendered frame-by-frame and the webcam element keeps playing
  // (hidden under h-0 overflow-hidden) so ctx.drawImage() still works.
  // ─────────────────────────────────────────────────────────────────────
  const capturePreview = useCallback(async () => {
    const webcam = webcamRef.current;
    if (!webcam || downloadUsed) return;
    try {

    const isStackedLayout = selectedLayout === "stacked";
    // Stacked is portrait (9:16), all other layouts are landscape (16:9).
    const CW = isStackedLayout ? 1080 : 1920;
    const CH = isStackedLayout ? 1920 : 1080;

    // ── Off-screen canvas ───────────────────────────────────────────────
    const canvas = document.createElement("canvas");
    canvas.width  = CW;
    canvas.height = CH;
    canvas.style.cssText =
      "position:fixed;top:-99999px;left:-99999px;width:1px;height:1px;pointer-events:none;";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;

    // ── Load the ReactionBooth logo (white version for green/dark bg) ───
    // Fetched as SVG text so we can modify fill colors to white.
    let logoImg: HTMLImageElement | null = null;
    try {
      const svgText = await fetch("/assets/ReactionBoothLogo.svg").then((r) => r.text());
      const whiteSvg = svgText
        .replace(/#2ee6a6/gi, "#ffffff")
        .replace(/#f7f9f8/gi, "#ffffff");
      const blob = new Blob([whiteSvg], { type: "image/svg+xml" });
      const url  = URL.createObjectURL(blob);
      logoImg = new Image();
      await new Promise<void>((resolve) => {
        logoImg!.onload  = () => resolve();
        logoImg!.onerror = () => { logoImg = null; resolve(); };
        logoImg!.src = url;
        setTimeout(resolve, 2000);
      });
      URL.revokeObjectURL(url);
    } catch {
      logoImg = null;
    }

    // ── Also load logo in brand-color version for the off-white closing slide ──
    let closingLogoImg: HTMLImageElement | null = null;
    if (senderPlan === "free") {
      try {
        closingLogoImg = new Image();
        closingLogoImg.src = "/assets/ReactionBoothLogo.svg";
        await new Promise<void>((resolve) => {
          closingLogoImg!.onload  = () => resolve();
          closingLogoImg!.onerror = () => { closingLogoImg = null; resolve(); };
          setTimeout(resolve, 2000);
        });
      } catch {
        closingLogoImg = null;
      }
    }

    // ── Pixel positions that match the CSS layout percentages ───────────
    const isCamMain = selectedLayout === "pip-cam-bottom-right";

    const positions = (() => {
      if (!hasEvents) return { yt: null, wc: { x: 0, y: 0, w: CW, h: CH }, ytOnTop: false };

      if (selectedLayout.startsWith("pip-") && !isCamMain) {
        // YT = main area, webcam = small PIP
        const ytX = PIP.mainX, ytY = PIP.mainY, ytW = PIP.mainW, ytH = PIP.mainH;
        const wcW = PIP.pipW, wcH = PIP.pipH;
        let wcX = 0, wcY = 0;
        if      (selectedLayout === "pip-bottom-right") { wcX = CW - wcW; wcY = CH - wcH; }
        else if (selectedLayout === "pip-bottom-left")  { wcX = 0;        wcY = CH - wcH; }
        else if (selectedLayout === "pip-top-right")    { wcX = CW - wcW; wcY = 0;       }
        else                                            { wcX = 0;        wcY = 0;       }
        return { yt: { x: ytX, y: ytY, w: ytW, h: ytH }, wc: { x: wcX, y: wcY, w: wcW, h: wcH }, ytOnTop: false };
      }

      if (isCamMain) {
        // Webcam = main area, YT = small PIP (bottom-right)
        return {
          yt: { x: CW - PIP.pipW, y: CH - PIP.pipH, w: PIP.pipW, h: PIP.pipH },
          wc: { x: PIP.mainX, y: PIP.mainY, w: PIP.mainW, h: PIP.mainH },
          ytOnTop: true,
        };
      }

      if (selectedLayout === "side-by-side") {
        return {
          yt: { x: 0,                        y: Math.round(0.25 * CH), w: Math.round(0.48438 * CW), h: Math.round(0.5 * CH) },
          wc: { x: Math.round(0.51563 * CW), y: Math.round(0.25 * CH), w: Math.round(0.48438 * CW), h: Math.round(0.5 * CH) },
          ytOnTop: false,
        };
      }
      // stacked
      const h = Math.round(0.47917 * CH);
      return { yt: { x: 0, y: 0, w: CW, h }, wc: { x: 0, y: CH - h, w: CW, h }, ytOnTop: false };
    })();

    // ── YouTube thumbnail — loads in background while recording ──────────
    let thumbImg: HTMLImageElement | null = null;
    if (hasEvents) {
      const vidId = reaction.videoUrl.match(
        /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/
      )?.[1];
      if (vidId) {
        thumbImg = new Image();
        thumbImg.crossOrigin = "anonymous";
        thumbImg.src = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
        thumbImg.onerror = () => { thumbImg = null; };
      }
    }

    // ── Canvas draw helper ───────────────────────────────────────────────
    // closingSlideElapsed: seconds since closing slide started (undefined = normal frame)
    const drawToCanvas = (closingSlideElapsed?: number) => {
      // ── Closing slide ────────────────────────────────────────────────
      if (closingSlideElapsed !== undefined) {
        const FADE_DURATION = 0.5; // seconds for cross-fade
        const fadeProgress = Math.min(closingSlideElapsed / FADE_DURATION, 1);

        if (fadeProgress < 1) {
          // Cross-fade: draw last normal frame, then overlay off-white with increasing opacity
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, CW, CH);

          if (!positions.ytOnTop) {
            // Draw YT behind webcam
            if (hasEvents && positions.yt) {
              const { x, y, w, h } = positions.yt;
              if (thumbImg?.complete && thumbImg.naturalWidth > 0) {
                try { ctx.drawImage(thumbImg, x, y, w, h); } catch { /* taint */ }
                ctx.fillStyle = "rgba(0,0,0,0.28)";
                ctx.fillRect(x, y, w, h);
              } else {
                ctx.fillStyle = "#111827";
                ctx.fillRect(x, y, w, h);
              }
            }
            if (webcam.readyState >= 2) {
              try { ctx.drawImage(webcam, positions.wc.x, positions.wc.y, positions.wc.w, positions.wc.h); } catch { /* skip */ }
            }
          } else {
            // Draw webcam behind YT
            if (webcam.readyState >= 2) {
              try { ctx.drawImage(webcam, positions.wc.x, positions.wc.y, positions.wc.w, positions.wc.h); } catch { /* skip */ }
            }
            if (hasEvents && positions.yt) {
              const { x, y, w, h } = positions.yt;
              if (thumbImg?.complete && thumbImg.naturalWidth > 0) {
                try { ctx.drawImage(thumbImg, x, y, w, h); } catch { /* taint */ }
                ctx.fillStyle = "rgba(0,0,0,0.28)";
                ctx.fillRect(x, y, w, h);
              } else {
                ctx.fillStyle = "#111827";
                ctx.fillRect(x, y, w, h);
              }
            }
          }

          // Off-white overlay (fading in)
          ctx.fillStyle = `rgba(247, 249, 248, ${fadeProgress})`;
          ctx.fillRect(0, 0, CW, CH);
        } else {
          // Full off-white closing slide
          ctx.fillStyle = "#f7f9f8";
          ctx.fillRect(0, 0, CW, CH);
          // Draw brand-colored logo centered
          if (closingLogoImg?.complete) {
            const logoH = Math.round(CH * 0.1);
            const logoW = Math.round(logoH * LOGO_ASPECT);
            ctx.drawImage(closingLogoImg, (CW - logoW) / 2, (CH - logoH) / 2, logoW, logoH);
          }
        }
        return;
      }

      // ── Normal frame ────────────────────────────────────────────────
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CW, CH);

      const drawYT = () => {
        if (hasEvents && positions.yt) {
          const { x, y, w, h } = positions.yt;
          if (thumbImg?.complete && thumbImg.naturalWidth > 0) {
            try { ctx.drawImage(thumbImg, x, y, w, h); } catch { /* taint */ }
            ctx.fillStyle = "rgba(0,0,0,0.28)";
            ctx.fillRect(x, y, w, h);
          } else {
            ctx.fillStyle = "#111827";
            ctx.fillRect(x, y, w, h);
          }
        }
      };

      const drawWC = () => {
        if (webcam.readyState >= 2 /* HAVE_CURRENT_DATA */) {
          try {
            ctx.drawImage(webcam, positions.wc.x, positions.wc.y, positions.wc.w, positions.wc.h);
          } catch { /* skip frame */ }
        }
      };

      if (!positions.ytOnTop) {
        // Standard: YT first (behind), webcam on top
        drawYT();
        drawWC();
      } else {
        // Inverted PIP: webcam first (behind), YT on top
        drawWC();
        drawYT();
      }

      // Watermark logo in the top margin (pip/cam-main layouts only)
      if (reaction.watermarked && selectedLayout.startsWith("pip-")) {
        const topMargin = isStackedLayout ? 0 : PIP.mainY; // 75px
        const logoH = Math.round(topMargin * 0.55);
        const logoW = Math.round(logoH * LOGO_ASPECT);
        if (logoImg?.complete && logoH > 4 && logoW > 0) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.drawImage(logoImg, (CW - logoW) / 2, (topMargin - logoH) / 2, logoW, logoH);
          ctx.restore();
        } else if (logoH > 0) {
          // Fallback text
          const fs  = Math.max(11, Math.round(topMargin * 0.45));
          ctx.save();
          ctx.font         = `500 ${fs}px system-ui, sans-serif`;
          ctx.fillStyle    = "rgba(255,255,255,0.85)";
          ctx.textBaseline = "middle";
          ctx.textAlign    = "center";
          ctx.fillText("ReactionBooth", CW / 2, topMargin / 2);
          ctx.restore();
        }
      } else if (reaction.watermarked) {
        // Non-PIP layouts: bottom-left corner watermark
        const fs  = Math.max(13, Math.round(CW * 0.007));
        const pad = Math.round(CW * 0.008);
        ctx.save();
        ctx.font         = `500 ${fs}px system-ui, sans-serif`;
        ctx.fillStyle    = "rgba(255,255,255,0.65)";
        ctx.textBaseline = "bottom";
        ctx.fillText("ReactionBooth", positions.wc.x + pad, positions.wc.y + positions.wc.h - pad);
        ctx.restore();
      }

      if (webcam.duration > 0 && isFinite(webcam.duration)) {
        setRecordingProgress(Math.round((webcam.currentTime / webcam.duration) * 100));
      }
    };

    // ── Shared finalisation ──────────────────────────────────────────────
    const finalize = (blob: Blob, ext: string) => {
      cancelAnimationFrame(drawLoopRef.current);
      drawLoopRef.current = 0;
      if (canvas.parentNode) document.body.removeChild(canvas);
      captureMediaRecorderRef.current = null;
      captureStreamRef.current        = null;
      stopRecordingRef.current        = null;
      if (senderPlan === "free") setDownloadUsed(true);
      // Track the download server-side so the burn-after-use limit persists across page reloads.
      fetch(`/api/reactions/${reaction.id}/download`, { method: "POST" }).catch(() => {});
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `reaction-${reaction.id}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setRecordingProgress(100);
      setDownloadState({ status: "idle" });
    };

    // ── Enter "capturing" state, then reset the playhead ────────────────
    setRecordingProgress(0);
    setDownloadState({ status: "capturing" });
    webcam.currentTime = 0;
    // Wait for the seek to settle before starting the encoder loop.
    await new Promise<void>((resolve) => {
      const onSeeked = () => resolve();
      webcam.addEventListener("seeked", onSeeked, { once: true });
      setTimeout(() => { webcam.removeEventListener("seeked", onSeeked); resolve(); }, 1000);
    });

    // ── Path A — WebCodecs → true .mp4 (Chrome / Edge 94+) ──────────────
    const hasWebCodecs =
      typeof VideoEncoder            !== "undefined" &&
      typeof AudioEncoder            !== "undefined" &&
      typeof VideoFrame              !== "undefined" &&
      typeof MediaStreamTrackProcessor !== "undefined";

    let useWebCodecs = false;
    if (hasWebCodecs) {
      try {
        const check = await VideoEncoder.isConfigSupported({
          codec: "avc1.42001f",
          width: CW,
          height: CH,
          bitrate: 8_000_000,
          framerate: 30,
        });
        useWebCodecs = check.supported ?? false;
      } catch {
        useWebCodecs = false;
      }
    }

    if (useWebCodecs) {
      const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
      const muxTarget = new ArrayBufferTarget();
      const muxer = new Muxer({
        target: muxTarget,
        video: { codec: "avc", width: CW, height: CH },
        audio: { codec: "aac", sampleRate: 48_000, numberOfChannels: 2 },
        fastStart: "in-memory",
      });

      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta!),
        error: (e) => {
          console.error("VideoEncoder:", e);
          if (!active) return;
          active = false;
          cancelAnimationFrame(drawLoopRef.current);
          if (canvas.parentNode) document.body.removeChild(canvas);
          stopRecordingRef.current = null;
          setDownloadState({ status: "error", message: e.message ?? "Video encoding failed" });
        },
      });
      videoEncoder.configure({
        codec:                 "avc1.42001f", // H.264 Baseline 3.1
        width:                 CW,
        height:                CH,
        bitrate:               8_000_000,
        framerate:             30,
        hardwareAcceleration:  "prefer-hardware",
      });

      // Audio: read raw PCM from the webcam element's audio track.
      let audioEncoder: AudioEncoder | null = null;
      let audioReader: ReadableStreamDefaultReader<AudioData> | null = null;

      const wcStream = (webcam as unknown as { captureStream?(): MediaStream }).captureStream?.();
      const audioTrack = wcStream?.getAudioTracks()[0];

      if (audioTrack) {
        audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta!),
          error:  (e) => console.error("AudioEncoder:", e),
        });
        audioEncoder.configure({
          codec:            "mp4a.40.2", // AAC-LC
          sampleRate:       48_000,
          numberOfChannels: 2,
          bitrate:          128_000,
        });
        const processor = new MediaStreamTrackProcessor({ track: audioTrack });
        audioReader = (processor.readable as ReadableStream<AudioData>).getReader();
        (async () => {
          try {
            for (;;) {
              const { done, value } = await audioReader!.read();
              if (done) break;
              if (audioEncoder?.state === "configured") audioEncoder.encode(value);
              value.close();
            }
          } catch { /* stream ended or cancelled */ }
        })();
      }

      let frameCount = 0;
      let active     = true;

      const encodeFrame = () => {
        if (!active) return;
        try {
          drawToCanvas();
          const timestamp = Math.round(frameCount * (1_000_000 / 30)); // µs at 30 fps
          const frame = new VideoFrame(canvas, { timestamp });
          videoEncoder.encode(frame, { keyFrame: frameCount % 90 === 0 });
          frame.close();
          frameCount++;
        } catch (e) {
          console.error("Frame encode error:", e);
          active = false;
          if (canvas.parentNode) document.body.removeChild(canvas);
          stopRecordingRef.current = null;
          setDownloadState({ status: "error", message: e instanceof Error ? e.message : "Frame encoding failed" });
          return;
        }
        drawLoopRef.current = requestAnimationFrame(encodeFrame);
      };

      const stop = async () => {
        if (!active) return;
        active = false;
        cancelAnimationFrame(drawLoopRef.current);
        try { await audioReader?.cancel(); } catch {}
        await videoEncoder.flush();
        videoEncoder.close();
        if (audioEncoder) {
          await audioEncoder.flush();
          audioEncoder.close();
        }
        muxer.finalize();
        finalize(new Blob([muxTarget.buffer], { type: "video/mp4" }), "mp4");
      };

      stopRecordingRef.current = () => { stop(); };
      drawLoopRef.current = requestAnimationFrame(encodeFrame);
      try { await webcam.play(); } catch (e) { console.error("play() failed:", e); }

      // When webcam ends, either add the closing slide (free) or stop directly.
      webcam.addEventListener("ended", () => {
        if (!active) return;
        cancelAnimationFrame(drawLoopRef.current);

        if (senderPlan !== "free") {
          stop();
          return;
        }

        // ── 3-second closing slide ──────────────────────────────────
        const CLOSING_DURATION_S = 3;
        const CLOSING_FRAMES = Math.round(30 * CLOSING_DURATION_S);
        let closingFrame = 0;

        const encodeClosingFrame = () => {
          if (!active || closingFrame >= CLOSING_FRAMES) { stop(); return; }
          try {
            const elapsed = closingFrame / 30;
            drawToCanvas(elapsed);
            const ts = Math.round((frameCount + closingFrame) * (1_000_000 / 30));
            const frame = new VideoFrame(canvas, { timestamp: ts });
            videoEncoder.encode(frame, { keyFrame: (frameCount + closingFrame) % 90 === 0 });
            frame.close();
            closingFrame++;
          } catch (e) {
            console.error("Closing frame error:", e);
            stop();
            return;
          }
          drawLoopRef.current = requestAnimationFrame(encodeClosingFrame);
        };
        drawLoopRef.current = requestAnimationFrame(encodeClosingFrame);
      }, { once: true });

    } else {
      // ── Path B — MediaRecorder fallback (.mp4 on Safari, .webm elsewhere)
      const wcStream = (webcam as unknown as { captureStream?(): MediaStream }).captureStream?.();
      const audioTracks = wcStream?.getAudioTracks() ?? [];
      const canvasStream = canvas.captureStream(30);
      const combined = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

      const mp4Mime = "video/mp4;codecs=avc1,mp4a.40.2";
      const mimeType = MediaRecorder.isTypeSupported(mp4Mime)
        ? mp4Mime
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";

      const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        combined.getTracks().forEach((t) => t.stop());
        finalize(new Blob(chunks, { type: mimeType }), ext);
      };

      captureMediaRecorderRef.current = recorder;
      captureStreamRef.current        = combined;
      stopRecordingRef.current = () => { if (recorder.state !== "inactive") recorder.stop(); };

      const draw = () => { drawToCanvas(); drawLoopRef.current = requestAnimationFrame(draw); };
      drawLoopRef.current = requestAnimationFrame(draw);
      recorder.start(1_000);
      try { await webcam.play(); } catch (e) { console.error("play() failed:", e); }

      // When webcam ends, either add the closing slide (free) or stop directly.
      webcam.addEventListener("ended", () => {
        if (senderPlan !== "free") {
          if (recorder.state !== "inactive") recorder.stop();
          return;
        }

        // ── 3-second closing slide ──────────────────────────────────
        cancelAnimationFrame(drawLoopRef.current);
        const CLOSING_DURATION_S = 3;
        const startMs = Date.now();

        const drawClosingFrame = () => {
          const elapsed = (Date.now() - startMs) / 1000;
          if (elapsed >= CLOSING_DURATION_S) {
            if (recorder.state !== "inactive") recorder.stop();
            return;
          }
          drawToCanvas(elapsed);
          drawLoopRef.current = requestAnimationFrame(drawClosingFrame);
        };
        drawLoopRef.current = requestAnimationFrame(drawClosingFrame);
      }, { once: true });
    }
    } catch (e) {
      console.error("capturePreview error:", e);
      setDownloadState({ status: "error", message: "Recording failed. Please try again." });
    }
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

  // Stop an in-progress recording (manual "Stop & save now")
  const stopCapture = useCallback(() => {
    webcamRef.current?.pause();
    const stop = stopRecordingRef.current;
    if (stop) {
      stop(); // handles its own cleanup via finalize()
    } else {
      // Fallback if called before stopRecordingRef is wired
      cancelAnimationFrame(drawLoopRef.current);
      if (captureMediaRecorderRef.current?.state !== "inactive") {
        captureMediaRecorderRef.current?.stop();
      }
    }
  }, []);

  // ── Server-side FFmpeg composition ─────────────────────────────────────
  const [compositingElapsed, setCompositingElapsed] = useState(0);

  useEffect(() => {
    if (downloadState.status !== "compositing") { setCompositingElapsed(0); return; }
    const id = setInterval(() => setCompositingElapsed((s: number) => s + 1), 1_000);
    return () => clearInterval(id);
  }, [downloadState.status]);

  const downloadComposed = useCallback(async () => {
    if (downloadUsed) return;
    setDownloadState({ status: "compositing" });
    try {
      const res = await fetch(`/api/reactions/${reaction.id}/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout: selectedLayout,
          youtubeVolume: ytVolume,
          webcamVolume:  wcVolume,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Server error ${res.status}`);
      }
      const { composedUrl } = await res.json() as { composedUrl: string };
      await fetch(`/api/reactions/${reaction.id}/download`, { method: "POST" }).catch(() => {});
      if (senderPlan === "free") setDownloadUsed(true);
      const a = document.createElement("a");
      a.href = composedUrl;
      a.download = `reaction-${reaction.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadState({ status: "idle" });
    } catch (e) {
      setDownloadState({
        status: "error",
        message: e instanceof Error ? e.message : "Compositing failed. Please try again.",
      });
    }
  }, [downloadUsed, reaction.id, selectedLayout, ytVolume, wcVolume, senderPlan]);

  // Layout helpers
  const isPip     = selectedLayout.startsWith("pip-") && selectedLayout !== "pip-cam-bottom-right";
  const isCamMain = selectedLayout === "pip-cam-bottom-right";
  const isStacked = selectedLayout === "stacked";

  // New PIP proportions as CSS percentages (based on 1920×1080 canvas)
  // Main area: 85px left / 75px top / 1750px wide / 977px tall
  // PIP:       550px wide / 310px tall, flush to canvas corner
  const PIP_MAIN_LEFT   = "4.427%";
  const PIP_MAIN_TOP    = "6.944%";
  const PIP_MAIN_WIDTH  = "91.146%";
  const PIP_MAIN_HEIGHT = "90.463%";
  const PIP_SMALL_WIDTH  = "28.646%";
  const PIP_SMALL_HEIGHT = "28.704%";

  const getPreviewContainerStyle = (): React.CSSProperties => {
    if (isStacked) return { backgroundColor: "#2EE6A6", aspectRatio: "9/16", height: "calc(100vh - 14rem)" };
    return { backgroundColor: "#2EE6A6", aspectRatio: "16/9" };
  };

  const getYouTubeContainerStyle = (): React.CSSProperties => {
    if (!hasEvents) return { display: "none" };
    if (isPip) return {
      position: "absolute", left: PIP_MAIN_LEFT, top: PIP_MAIN_TOP,
      width: PIP_MAIN_WIDTH, height: PIP_MAIN_HEIGHT, overflow: "hidden",
    };
    if (isCamMain) return {
      // YT is the small PIP in the bottom-right corner
      position: "absolute", right: "0%", bottom: "0%",
      width: PIP_SMALL_WIDTH, height: PIP_SMALL_HEIGHT,
      overflow: "hidden", zIndex: 10,
    };
    if (selectedLayout === "side-by-side") return {
      position: "absolute", left: 0, top: "25%", width: "48.438%", height: "50%", overflow: "hidden",
    };
    return { position: "absolute", top: 0, left: 0, width: "100%", height: "47.917%", overflow: "hidden" };
  };

  const getWebcamContainerStyle = (): React.CSSProperties => {
    if (isPip) {
      const base: React.CSSProperties = {
        position: "absolute", width: PIP_SMALL_WIDTH, height: PIP_SMALL_HEIGHT,
        overflow: "hidden", zIndex: 10,
      };
      switch (selectedLayout) {
        case "pip-bottom-right": return { ...base, right: "0%", bottom: "0%" };
        case "pip-bottom-left":  return { ...base, left:  "0%", bottom: "0%" };
        case "pip-top-right":    return { ...base, right: "0%", top:    "0%" };
        case "pip-top-left":     return { ...base, left:  "0%", top:    "0%" };
        default:                 return { ...base, right: "0%", bottom: "0%" };
      }
    }
    if (isCamMain) return {
      // Webcam is the large main area
      position: "absolute", left: PIP_MAIN_LEFT, top: PIP_MAIN_TOP,
      width: PIP_MAIN_WIDTH, height: PIP_MAIN_HEIGHT, overflow: "hidden",
    };
    if (selectedLayout === "side-by-side") return {
      position: "absolute", left: "51.563%", top: "25%", width: "48.438%", height: "50%", overflow: "hidden",
    };
    return { position: "absolute", bottom: 0, left: 0, width: "100%", height: "47.917%", overflow: "hidden" };
  };

  const getWatermarkStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "absolute",
      pointerEvents: "none",
      zIndex: 20,
    };
    // PIP and cam-main layouts: watermark lives in the top green margin, centered
    if (isPip || isCamMain) {
      return {
        ...base,
        top: "1.2%",
        left: "50%",
        transform: "translateX(-50%)",
        height: "4%",
        width: "auto",
      };
    }
    if (isStacked) return { ...base, top: "49.6%", left: "50%", transform: "translate(-50%, -50%)", height: "3%", width: "auto" };
    if (selectedLayout === "side-by-side") return { ...base, bottom: "3%", left: "50%", transform: "translateX(-50%)", height: "3%", width: "auto" };
    return { ...base, bottom: "1.5%", left: "1.5%", height: "3%", width: "auto" };
  };

  const isCapturing = downloadState.status === "capturing";

  const recipientLabel = reaction.recipientName || reaction.recipientEmail;
  const senderLabel    = reaction.requesterName  || reaction.senderEmail;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reaction Video</h1>
        <p className="text-gray-500">
          {recipientLabel}&apos;s reaction to a video from {senderLabel}
        </p>
      </div>

      {/* ── Video preview area ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-2 relative">
        {hasEvents ? (
          <div className={isStacked ? "flex justify-center bg-black" : ""}>
            <div className="relative overflow-hidden" style={getPreviewContainerStyle()}>
              {/* YouTube — behind in standard PIP, on top in cam-main */}
              <div style={getYouTubeContainerStyle()}>
                <YouTubePlayer
                  ref={youtubeRef}
                  videoUrl={reaction.videoUrl}
                  controlledMode={true}
                  onReady={() => setYoutubeReady(true)}
                  className="relative w-full h-full bg-black overflow-hidden"
                />
              </div>
              {/* Webcam */}
              <div style={getWebcamContainerStyle()}>
                <video ref={webcamRef} src={reaction.recordingUrl} playsInline crossOrigin="anonymous" className="w-full h-full object-cover" />
              </div>
              {/* Watermark logo in top margin */}
              {reaction.watermarked && (
                <img
                  src="/assets/ReactionBoothLogo.svg"
                  alt="ReactionBooth"
                  style={{
                    ...getWatermarkStyle(),
                    filter: (isPip || isCamMain) ? "brightness(0) invert(1)" : "none",
                    opacity: (isPip || isCamMain) ? 0.85 : 0.65,
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <video ref={webcamRef} src={reaction.recordingUrl} playsInline crossOrigin="anonymous" className="w-full aspect-video bg-black" />
          </div>
        )}

        {/* Opaque overlay shown during canvas recording */}
        {isCapturing && (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-20">
            <div className="w-14 h-14 border-[5px] border-brand border-t-transparent rounded-full animate-spin mb-5" />
            <p className="text-white font-semibold text-xl mb-1">Recording HD video…</p>
            <p className="text-gray-400 text-sm mb-6">
              {recordingProgress < 100 ? `${recordingProgress}% complete` : "Finalising…"}
            </p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${recordingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Player bar (hidden during recording) ────────────────────────── */}
      {!isCapturing && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range" min={0} max={duration > 0 ? duration : 1} step={0.1} value={currentTime}
              onPointerDown={() => { isSeekingRef.current = true; }}
              onPointerUp={()   => { isSeekingRef.current = false; }}
              onPointerCancel={() => { isSeekingRef.current = false; }}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand"
            />
            <span className="text-xs text-gray-400 tabular-nums w-10">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center bg-brand hover:bg-brand-600 text-soft-black rounded-full transition-colors flex-shrink-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
            {hasEvents && (
              <div className="flex items-center gap-4 flex-1 ml-4">
                <CompactVolume icon="yt"  label="YouTube" value={ytVolume} onChange={setYtVolume} />
                <CompactVolume icon="cam" label="Webcam"  value={wcVolume} onChange={setWcVolume} />
              </div>
            )}
            {!hasEvents && (
              <div className="flex items-center gap-2 ml-4">
                <CompactVolume
                  icon="cam" label="Volume" value={wcVolume}
                  onChange={(v) => { setWcVolume(v); if (webcamRef.current) webcamRef.current.volume = Math.min(v / 100, 1.0); }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hint text */}
      {hasEvents && downloadState.status === "idle" && (
        <p className="text-center text-xs text-gray-400 mb-6">
          Press play above to preview. Adjust layout and volume before downloading.
        </p>
      )}

      {/* Layout chooser */}
      {hasEvents && downloadState.status === "idle" && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Layout</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {availableLayouts.map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLayout(l)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                  selectedLayout === l ? "border-brand bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <LayoutIcon layout={l} active={selectedLayout === l} />
                <span className={`text-[10px] leading-tight text-center ${selectedLayout === l ? "text-brand-700 font-semibold" : "text-gray-500"}`}>
                  {LAYOUTS[l]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Download section ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4">

        {downloadState.status === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={hasEvents ? downloadComposed : capturePreview}
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
                : "Save Reaction Video"}
            </button>
            {!downloadUsed && hasEvents && (
              <p className="text-xs text-gray-400 text-center max-w-xs">
                Our servers composite the YouTube video with your reaction at full quality — no browser recording needed.
              </p>
            )}
            {!downloadUsed && !hasEvents && (
              <p className="text-xs text-gray-400">
                Records the webcam video at 1080p HD.
              </p>
            )}
          </div>
        )}

        {downloadState.status === "compositing" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-10 h-10 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-700 font-medium">Compositing your video…</p>
            <p className="text-gray-400 text-sm text-center max-w-xs">
              {compositingElapsed < 5
                ? "Starting up…"
                : compositingElapsed < 60
                ? `${compositingElapsed}s — downloading YouTube video…`
                : `${Math.floor(compositingElapsed / 60)}m ${compositingElapsed % 60}s — compositing with FFmpeg…`}
            </p>
            <p className="text-xs text-gray-400">Don&apos;t close this tab.</p>
          </div>
        )}

        {isCapturing && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={stopCapture}
              className="text-sm text-gray-300 border border-gray-600 px-5 py-2.5 rounded-xl hover:bg-gray-800 hover:text-white transition-colors"
            >
              Stop &amp; save now
            </button>
            <p className="text-xs text-gray-400">
              The file will download automatically when recording finishes.
            </p>
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

// ── Compact volume slider ──────────────────────────────────────────────────
function CompactVolume({
  icon, label, value, onChange,
}: { icon: "yt" | "cam"; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        {icon === "yt"
          ? <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>
          : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>}
      </svg>
      <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>
      <input
        type="range" min={0} max={200} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand min-w-0"
      />
      <span className="text-xs text-gray-400 tabular-nums w-9 text-right">{value}%</span>
    </div>
  );
}

// ── Layout icon thumbnails ─────────────────────────────────────────────────
function LayoutIcon({ layout, active }: { layout: WatchLayout; active: boolean }) {
  const bg = active ? "bg-brand" : "bg-gray-600";
  const fg = active ? "bg-brand-400" : "bg-gray-400";

  if (layout === "pip-cam-bottom-right") {
    // Webcam (lighter) is the large area, YouTube (darker) is the small PIP
    return (
      <div className={`w-12 h-8 ${fg} rounded relative`}>
        <div className={`absolute bottom-0.5 right-0.5 w-4 h-3 ${bg} rounded-sm`} />
      </div>
    );
  }

  if (layout.startsWith("pip-")) {
    const posMap: Record<string, string> = {
      "pip-bottom-right": "bottom-0.5 right-0.5",
      "pip-bottom-left":  "bottom-0.5 left-0.5",
      "pip-top-right":    "top-0.5 right-0.5",
      "pip-top-left":     "top-0.5 left-0.5",
    };
    return (
      <div className={`w-12 h-8 ${bg} rounded relative`}>
        <div className={`absolute ${posMap[layout] ?? "bottom-0.5 right-0.5"} w-4 h-3 ${fg} rounded-sm`} />
      </div>
    );
  }
  if (layout === "side-by-side") {
    return (
      <div className="w-12 h-8 rounded flex overflow-hidden gap-px">
        <div className={`flex-1 ${bg}`} /><div className={`flex-1 ${fg}`} />
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
