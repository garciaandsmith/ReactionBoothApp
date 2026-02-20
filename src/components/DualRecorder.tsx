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

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Request webcam + mic with audio processing disabled to prevent
  // echo cancellation from ducking the mic when YouTube plays
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

  // Connect webcam stream to video element after render
  useEffect(() => {
    if (webcamRef.current && stream) {
      webcamRef.current.srcObject = stream;
    }
  }, [stream, permissionGranted]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  // Handle YouTube state changes during recording
  const handleYouTubeStateChange = useCallback(
    (state: number, videoTime: number) => {
      if (!isRecording) return;

      const eventType = STATE_MAP[state];
      if (!eventType) return;

      // Detect seeks: if we get a play event and the video time jumped significantly
      const now = performance.now();
      if (eventType === "play" && eventsRef.current.length > 0) {
        const lastEvent = eventsRef.current[eventsRef.current.length - 1];
        const timeSinceLastEvent = (now - recordingStartRef.current) - lastEvent.timestampMs;
        const expectedVideoTime = lastEvent.videoTimeS + timeSinceLastEvent / 1000;
        if (Math.abs(videoTime - expectedVideoTime) > 2) {
          eventsRef.current.push({
            type: "seek",
            timestampMs: now - recordingStartRef.current,
            videoTimeS: videoTime,
          });
        }
      }

      eventsRef.current.push({
        type: eventType,
        timestampMs: now - recordingStartRef.current,
        videoTimeS: videoTime,
      });

      // Auto-stop when YouTube video ends
      if (eventType === "ended") {
        stopDualRecording();
      }
    },
    [isRecording]
  );

  // Start both recordings simultaneously
  const startDualRecording = useCallback(() => {
    if (!stream) return;

    // Reset
    chunksRef.current = [];
    eventsRef.current = [];
    recordingStartRef.current = performance.now();

    // Start MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (pendingEventLogRef.current) {
        onRecordingComplete(blob, pendingEventLogRef.current);
      }
    };

    mediaRecorder.start(1000);

    // Start YouTube from beginning
    youtubeRef.current?.seekTo(0);
    youtubeRef.current?.play();

    setIsRecording(true);
    setElapsed(0);

    // Elapsed timer — auto-stop at maxDuration
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

  // Stop both recordings
  const stopDualRecording = useCallback(() => {
    // Pause YouTube
    youtubeRef.current?.pause();

    // Build event log before stopping MediaRecorder
    const durationMs = performance.now() - recordingStartRef.current;
    pendingEventLogRef.current = {
      version: 1,
      videoId: extractYouTubeId(videoUrl) || "",
      videoUrl,
      recordingStartedAt: new Date(Date.now() - durationMs).toISOString(),
      events: [...eventsRef.current],
      recordingDurationMs: durationMs,
    };

    // Stop MediaRecorder (triggers onstop → onRecordingComplete)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  }, [videoUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Permission screen
  if (!permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
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
          Enable Camera & Mic
        </button>
      </div>
    );
  }

  // Main recording UI — side by side layout
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* YouTube player — full controls, user can interact */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Video to watch</h2>
          <YouTubePlayer
            ref={youtubeRef}
            videoUrl={videoUrl}
            controlledMode={false}
            onStateChange={handleYouTubeStateChange}
            onReady={() => setYoutubeReady(true)}
          />
        </div>

        {/* Webcam feed */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Your reaction</h2>
          <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden">
            <video
              ref={webcamRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Recording timer overlay */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>{formatTime(elapsed)}</span>
                <span className="text-gray-400">/ {formatTime(maxDuration)}</span>
              </div>
            )}

            {/* Progress bar */}
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${(elapsed / maxDuration) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global record/stop button */}
      <div className="flex justify-center">
        {!isRecording ? (
          <button
            onClick={startDualRecording}
            disabled={!youtubeReady}
            className="flex items-center gap-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-medium transition-colors shadow-lg"
          >
            <div className="w-4 h-4 bg-white rounded-full" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopDualRecording}
            className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-medium transition-colors shadow-lg animate-pulse"
          >
            <div className="w-4 h-4 bg-white rounded-sm" />
            Stop Recording
          </button>
        )}
      </div>

      {watermarked && (
        <p className="text-center text-xs text-gray-400">
          Free tier — reaction will include a ReactionBooth watermark
        </p>
      )}
    </div>
  );
}
