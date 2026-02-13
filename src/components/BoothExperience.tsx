"use client";

import { useState, useCallback } from "react";
import VideoRecorder from "./VideoRecorder";
import YouTubePlayer from "./YouTubePlayer";

interface Reaction {
  id: string;
  videoUrl: string;
  senderEmail: string;
  introMessage: string | null;
  maxVideoLength: number;
  watermarked: boolean;
}

type BoothStep = "welcome" | "setup" | "recording" | "uploading" | "done";

export default function BoothExperience({ reaction }: { reaction: Reaction }) {
  const [step, setStep] = useState<BoothStep>("welcome");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setStep("uploading");
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("recording", blob, "reaction.webm");

        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 500);

        const res = await fetch(`/api/reactions/${reaction.id}/upload`, {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        setUploadProgress(100);
        setStep("done");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload recording"
        );
        setStep("recording");
      }
    },
    [reaction.id]
  );

  if (step === "welcome") {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          You&apos;ve been invited to a Reaction Booth!
        </h1>
        <p className="text-gray-500 mb-4">
          <strong>{reaction.senderEmail}</strong> wants to see your reaction to a
          video.
        </p>
        {reaction.introMessage && (
          <div className="bg-indigo-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Their message:</p>
            <p className="text-indigo-700 italic">
              &ldquo;{reaction.introMessage}&rdquo;
            </p>
          </div>
        )}
        <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Here&apos;s how it works:
          </h3>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </span>
            <p className="text-sm text-gray-600">
              We&apos;ll ask for camera and microphone access to record your
              reaction
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </span>
            <p className="text-sm text-gray-600">
              Watch the video and press record when you&apos;re ready — be
              yourself!
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </span>
            <p className="text-sm text-gray-600">
              When you&apos;re done, we&apos;ll send the reaction to both of you
            </p>
          </div>
        </div>
        <button
          onClick={() => setStep("setup")}
          className="bg-indigo-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Let&apos;s Go!
        </button>
      </div>
    );
  }

  if (step === "setup" || step === "recording") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Video to watch
            </h2>
            <YouTubePlayer videoUrl={reaction.videoUrl} />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">
              Your reaction
            </h2>
            <VideoRecorder
              reactionId={reaction.id}
              maxDuration={reaction.maxVideoLength}
              onRecordingComplete={handleRecordingComplete}
              onError={setError}
            />
          </div>
        </div>

        {reaction.watermarked && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Free tier — reaction will include a ReactionBooth watermark
          </p>
        )}

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Uploading your reaction...
        </h2>
        <p className="text-gray-500 mb-6">
          Hang tight, this won&apos;t take long.
        </p>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">{uploadProgress}%</p>
      </div>
    );
  }

  // done
  return (
    <div className="max-w-md mx-auto text-center py-20 px-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          width="36"
          height="36"
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
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Reaction recorded!
      </h1>
      <p className="text-gray-500 mb-8">
        Your reaction has been saved and both you and{" "}
        <strong>{reaction.senderEmail}</strong> will receive an email when
        it&apos;s ready to watch.
      </p>
      <a
        href="/"
        className="text-indigo-500 font-medium hover:text-indigo-600 transition-colors"
      >
        Back to ReactionBooth
      </a>
    </div>
  );
}
