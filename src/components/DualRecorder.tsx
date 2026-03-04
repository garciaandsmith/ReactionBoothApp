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

type RecordingPhase = "idle" | "countdown" | "recording" | "post_video" | "extended";

const STATE_MAP: Record<number, YouTubeEvent["type"] | null> = {
  0: "ended",
  1: "play",
  2: "pause",
  3: "buffering",
};

const COUNTDOWN_SECONDS = 5;
const POST_VIDEO_SECONDS = 10;

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
  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const postVideoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const phaseRef = useRef<RecordingPhase>("idle");

  // Stable refs updated each render so inner callbacks always see latest versions
  const doStopRef = useRef<() => void>(() => {});
  const enterPostVideoRef = useRef<() => void>(() => {});

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [postVideoRemaining, setPostVideoRemaining] = useState(POST_VIDEO_SECONDS);

  const setPhaseSync = useCallback((p: RecordingPhase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // ── Permissions ──
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
      if (mainTimerRef.current) clearInterval(mainTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (postVideoTimerRef.current) clearInterval(postVideoTimerRef.current);
    };
  }, [stream]);

  // ── Core stop logic ──
  const doStop = useCallback(() => {
    if (postVideoTimerRef.current) {
      clearInterval(postVideoTimerRef.current);
      postVideoTimerRef.current = null;
    }
    if (mainTimerRef.current) {
      clearInterval(mainTimerRef.current);
      mainTimerRef.current = null;
    }
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
  }, [videoUrl]);
  doStopRef.current = doStop;

  // ── Post-video 10-second window ──
  const enterPostVideoPhase = useCallback(() => {
    setPhaseSync("post_video");
    setPostVideoRemaining(POST_VIDEO_SECONDS);
    let remaining = POST_VIDEO_SECONDS;
    postVideoTimerRef.current = setInterval(() => {
      remaining -= 1;
      setPostVideoRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(postVideoTimerRef.current!);
        postVideoTimerRef.current = null;
        doStopRef.current();
      }
    }, 1000);
  }, [setPhaseSync]);
  enterPostVideoRef.current = enterPostVideoPhase;

  // ── YouTube state changes ──
  const handleYouTubeStateChange = useCallback((state: number, videoTime: number) => {
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

    if (eventType === "ended" && phaseRef.current === "recording") {
      enterPostVideoRef.current();
    }
  }, []);

  // ── Start actual recording (called after countdown) ──
  const startActualRecording = useCallback(() => {
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
    setPhaseSync("recording");
    setElapsed(0);

    mainTimerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDuration) {
          doStopRef.current();
        }
        return next;
      });
    }, 1000);
  }, [stream, maxDuration, onRecordingComplete, setPhaseSync]);

  // ── Countdown ──
  const startCountdown = useCallback(() => {
    setPhaseSync("countdown");
    setCountdown(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current!);
        countdownTimerRef.current = null;
        startActualRecording();
      }
    }, 1000);
  }, [setPhaseSync, startActualRecording]);

  // ── Extend recording (dismiss post-video window) ──
  const handleExtendRecording = useCallback(() => {
    if (postVideoTimerRef.current) {
      clearInterval(postVideoTimerRef.current);
      postVideoTimerRef.current = null;
    }
    setPhaseSync("extended");
  }, [setPhaseSync]);

  // ── Manual stop ──
  const handleStop = useCallback(() => {
    doStop();
  }, [doStop]);

  // ── Derived state ──
  const isActiveRecording = phase === "recording" || phase === "post_video" || phase === "extended";
  const progressPct = Math.min((elapsed / maxDuration) * 100, 100);
  const postVideoProgressPct = (postVideoRemaining / POST_VIDEO_SECONDS) * 100;

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
        {isActiveRecording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm z-10 pointer-events-none">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="tabular-nums">{formatTime(elapsed)}</span>
            <span className="text-gray-400">/ {formatTime(maxDuration)}</span>
          </div>
        )}

        {/* YouTube loading overlay */}
        {!youtubeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Pre-recording instruction overlay (idle & countdown) */}
        {youtubeReady && (phase === "idle" || phase === "countdown") && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white text-center">
            {phase === "idle" ? (
              <>
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-4">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2EE6A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-4">Your reaction booth is ready!</h3>
                <ul className="text-sm text-white/80 space-y-3 max-w-sm text-left">
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand flex-shrink-0 mt-0.5 text-base leading-none">①</span>
                    <span>
                      Click <strong className="text-white">Start Recording</strong> below — a{" "}
                      <strong className="text-white">5-second countdown</strong> will appear, then the
                      video and your webcam will start at the same time.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand flex-shrink-0 mt-0.5 text-base leading-none">②</span>
                    <span>
                      You can <strong className="text-white">pause, rewind, or replay</strong> the video
                      as much as you like — your reaction keeps recording. It can look even more natural!
                      {watermarked && (
                        <span className="text-white/50"> (Free tier: up to {formatTime(maxDuration)} total.)</span>
                      )}
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-brand flex-shrink-0 mt-0.5 text-base leading-none">③</span>
                    <span>
                      Once the video ends, you get <strong className="text-white">10 extra seconds</strong>{" "}
                      for final thoughts — or tap <strong className="text-white">Extend Recording</strong> to
                      keep going{watermarked ? ` (within your ${formatTime(maxDuration)} limit)` : ""}.
                    </span>
                  </li>
                </ul>
              </>
            ) : (
              /* Countdown phase */
              <div className="flex flex-col items-center gap-3">
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Get ready…</p>
                <div
                  className="text-9xl font-black tabular-nums text-white leading-none"
                  style={{ textShadow: "0 0 60px rgba(46,230,166,0.6), 0 0 20px rgba(46,230,166,0.4)" }}
                >
                  {countdown || "GO!"}
                </div>
                <p className="text-white/50 text-sm">Recording starts when it hits zero</p>
              </div>
            )}
          </div>
        )}

        {/* Post-video extend overlay */}
        {phase === "post_video" && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-5 p-6">
            <div className="text-white text-center">
              <p className="text-xl font-bold mb-1">Video ended!</p>
              <p className="text-sm text-white/70">
                Recording continues for a few more seconds — say your final thoughts!
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              {/* Extend button with depleting progress bar inside */}
              <button
                onClick={handleExtendRecording}
                className="relative w-full overflow-hidden bg-brand text-soft-black font-semibold py-3 px-6 rounded-xl transition-colors hover:opacity-90"
              >
                {/* Depleting fill — shrinks from right to left over 10 s */}
                <div
                  className="absolute inset-0 bg-brand-600/30 origin-left"
                  style={{
                    transform: `scaleX(${postVideoProgressPct / 100})`,
                    transformOrigin: "left center",
                    transition: "transform 1s linear",
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Extend Recording</span>
                  <span className="tabular-nums text-sm opacity-60">({postVideoRemaining}s)</span>
                </span>
              </button>
              <button
                onClick={handleStop}
                className="text-white/50 hover:text-white/80 text-sm transition-colors"
              >
                Stop now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar — time used vs plan limit */}
      {isActiveRecording && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              {phase === "post_video"
                ? "Extra time"
                : phase === "extended"
                ? "Extended recording"
                : "Recording progress"}
            </span>
            <span className="tabular-nums">{formatTime(elapsed)} / {formatTime(maxDuration)}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Webcam preview + controls row */}
      <div className="flex items-center gap-4">
        {/* Webcam — fixed-size preview */}
        <div
          className="relative rounded-xl overflow-hidden bg-gray-900 flex-shrink-0"
          style={{ width: 180, aspectRatio: "16/9" }}
        >
          <video
            ref={webcamRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="absolute bottom-1 left-2 text-white/60 text-[10px] font-medium pointer-events-none">
            You
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-2">
          {phase === "idle" && (
            <button
              onClick={startCountdown}
              disabled={!youtubeReady}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors w-full"
            >
              <span className="w-3 h-3 bg-white rounded-full flex-shrink-0" />
              {youtubeReady ? "Start Recording" : "Loading video…"}
            </button>
          )}

          {phase === "countdown" && (
            <button
              disabled
              className="flex items-center justify-center gap-2 bg-red-400 text-white px-6 py-3 rounded-xl font-semibold w-full opacity-80 cursor-not-allowed"
            >
              <span className="w-3 h-3 bg-white/60 rounded-full flex-shrink-0 animate-pulse" />
              Starting in {countdown}…
            </button>
          )}

          {(phase === "recording" || phase === "extended") && (
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-colors w-full"
            >
              <span className="w-3 h-3 bg-red-500 rounded-sm flex-shrink-0" />
              Stop Recording
            </button>
          )}

          {phase === "post_video" && (
            <button
              onClick={handleStop}
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
