"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import YouTubePlayer, { YouTubePlayerHandle } from "./YouTubePlayer";
import { extractYouTubeId } from "@/lib/youtube";
import type { YouTubeEvent, ReactionEventLog } from "@/lib/types";

interface DualRecorderProps {
  videoUrl: string;
  maxDuration: number;
  watermarked: boolean;
  onRecordingComplete: (blob: Blob, events: ReactionEventLog) => void;
  onError: (error: string) => void;
}

const STATE_MAP: Record<number, YouTubeEvent["type"] | null> = {
  0: "ended",
  1: "play",
  2: "pause",
  3: "buffering",
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DualRecorder({
  videoUrl,
  maxDuration,
  watermarked,
  onRecordingComplete,
  onError,
}: DualRecorderProps) {
  const youtubeRef = useRef<YouTubePlayerHandle>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const eventsRef = useRef<YouTubeEvent[]>([]);
  const recordingStartRef = useRef<number>(0);
  const pendingEventLogRef = useRef<ReactionEventLog | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  // Stable ref so handleYouTubeStateChange can call stopDualRecording
  // without a forward-reference issue or stale closure.
  const stopDualRecordingRef = useRef<() => void>(() => {});

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const requestPermissions = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      setStream(mediaStream);
      setPermissionGranted(true);
    } catch (err) {
      console.error("Permission error:", err);
      onError("Camera and microphone access is required. Please allow permissions and try again.");
    }
  }, [onError]);

  useEffect(() => {
    if (webcamRef.current && stream) {
      webcamRef.current.srcObject = stream;
    }
  }, [stream, permissionGranted]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  const handleYouTubeStateChange = useCallback(
    (state: number, videoTime: number) => {
      if (!isRecordingRef.current) return;
      const eventType = STATE_MAP[state];
      if (!eventType) return;

      const now = performance.now();
      if (eventType === "play" && eventsRef.current.length > 0) {
        const lastEvent = eventsRef.current[eventsRef.current.length - 1];
        const timeSinceLastEvent = now - recordingStartRef.current - lastEvent.timestampMs;
        const expectedVideoTime = lastEvent.videoTimeS + timeSinceLastEvent / 1000;
        if (Math.abs(videoTime - expectedVideoTime) > 2) {
          eventsRef.current.push({ type: "seek", timestampMs: now - recordingStartRef.current, videoTimeS: videoTime });
        }
      }

      eventsRef.current.push({ type: eventType, timestampMs: now - recordingStartRef.current, videoTimeS: videoTime });

      if (eventType === "ended") stopDualRecordingRef.current();
    },
    []
  );

  const startDualRecording = useCallback(() => {
    if (!stream) return;
    chunksRef.current = [];
    eventsRef.current = [];
    recordingStartRef.current = performance.now();

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (pendingEventLogRef.current) onRecordingComplete(blob, pendingEventLogRef.current);
    };

    mediaRecorder.start(1000);
    isRecordingRef.current = true;
    youtubeRef.current?.seekTo(0);
    youtubeRef.current?.play();

    setIsRecording(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= maxDuration) {
          stopDualRecording();
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stream, maxDuration, onRecordingComplete]);

  const stopDualRecording = useCallback(() => {
    isRecordingRef.current = false;
    youtubeRef.current?.pause();
    const durationMs = performance.now() - recordingStartRef.current;
    pendingEventLogRef.current = {
      version: 1,
      videoId: extractYouTubeId(videoUrl) || "",
      videoUrl,
      recordingStartedAt: new Date(Date.now() - durationMs).toISOString(),
      events: [...eventsRef.current],
      recordingDurationMs: durationMs,
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, [videoUrl]);
  // Keep the stable ref current so handleYouTubeStateChange always calls
  // the latest version without a forward-reference in its dep array.
  stopDualRecordingRef.current = stopDualRecording;

  // ── Permission screen ──
  if (!permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 min-h-[340px]">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to record?</h3>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-sm">
          We need access to your camera and microphone to capture your reaction.
        </p>
        <button
          onClick={requestPermissions}
          className="bg-brand text-soft-black px-6 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Enable Camera &amp; Mic
        </button>
      </div>
    );
  }

  const progressPct = Math.min((elapsed / maxDuration) * 100, 100);

  // ── Main UI: YouTube on top (full width), webcam below ──
  return (
    <div className="space-y-3">

      {/* YouTube — full width, 16:9 */}
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
        <YouTubePlayer
          ref={youtubeRef}
          videoUrl={videoUrl}
          controlledMode={false}
          onStateChange={handleYouTubeStateChange}
          onReady={() => setYoutubeReady(true)}
          className="absolute inset-0 w-full h-full"
        />

        {/* Recording badge — top left */}
        {isRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm z-10 pointer-events-none">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="tabular-nums">{formatTime(elapsed)}</span>
            <span className="text-gray-400">/ {formatTime(maxDuration)}</span>
          </div>
        )}

        {/* Loading overlay */}
        {!youtubeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isRecording && (
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Webcam preview + controls row */}
      <div className="flex items-center gap-4">
        {/* Webcam — fixed-size preview */}
        <div className="relative rounded-xl overflow-hidden bg-gray-900 flex-shrink-0" style={{ width: 180, aspectRatio: "16/9" }}>
          <video
            ref={webcamRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="absolute bottom-1 left-2 text-white/60 text-[10px] font-medium pointer-events-none">You</div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-2">
          {!isRecording ? (
            <button
              onClick={startDualRecording}
              disabled={!youtubeReady}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full"
            >
              <span className="w-3 h-3 bg-white rounded-full flex-shrink-0" />
              {youtubeReady ? "Start Recording" : "Loading video…"}
            </button>
          ) : (
            <button
              onClick={stopDualRecording}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full"
            >
              <span className="w-3 h-3 bg-red-500 rounded-sm flex-shrink-0" />
              Stop Recording
            </button>
          )}

          {watermarked && (
            <p className="text-xs text-gray-400 text-center">
              Free tier — reaction will include a ReactionBooth watermark
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
