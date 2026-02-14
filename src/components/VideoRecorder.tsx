"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface VideoRecorderProps {
  reactionId: string;
  maxDuration: number;
  onRecordingComplete: (blob: Blob) => void;
  onError: (error: string) => void;
}

export default function VideoRecorder({
  maxDuration,
  onRecordingComplete,
  onError,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const requestPermissions = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(mediaStream);
      setPermissionGranted(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Permission error:", err);
      onError(
        "Camera and microphone access is required. Please allow permissions and try again."
      );
    }
  }, [onError]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];
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
      onRecordingComplete(blob);
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= maxDuration) {
          mediaRecorderRef.current?.stop();
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRecording(false);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stream, maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!permissionGranted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to record?
        </h3>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-sm">
          We need access to your camera and microphone to capture your reaction.
          Your recording stays private.
        </p>
        <button
          onClick={requestPermissions}
          className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Enable Camera & Mic
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-2xl bg-gray-900 mirror"
        style={{ transform: "scaleX(-1)" }}
      />

      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>{formatTime(elapsed)}</span>
          <span className="text-gray-400">/ {formatTime(maxDuration)}</span>
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <div className="w-6 h-6 bg-white rounded-full" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <div className="w-6 h-6 bg-white rounded-sm" />
          </button>
        )}
      </div>

      {isRecording && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-2xl overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-1000"
            style={{ width: `${(elapsed / maxDuration) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
