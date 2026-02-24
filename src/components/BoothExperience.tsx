"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import DualRecorder from "./DualRecorder";
import type { ReactionEventLog } from "@/lib/types";

interface Reaction {
  id: string;
  videoUrl: string;
  introMessage: string | null;
  maxVideoLength: number;
  watermarked: boolean;
}

type BoothStep = "welcome" | "recording" | "uploading" | "done";

export default function BoothExperience({ reaction }: { reaction: Reaction }) {
  const [step, setStep] = useState<BoothStep>("welcome");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const handleRecordingComplete = useCallback(
    async (blob: Blob, events: ReactionEventLog) => {
      setStep("uploading");
      setUploadProgress(0);

      try {
        await upload(
          `reactions/${reaction.id}/reaction-${Date.now()}.webm`,
          blob,
          {
            access: "public",
            handleUploadUrl: `/api/reactions/${reaction.id}/upload`,
            // Pass events through so the server can persist them on completion
            clientPayload: JSON.stringify(events),
            onUploadProgress: ({ percentage }) => {
              setUploadProgress(Math.round(percentage));
            },
          }
        );

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
        <Image
          src="/assets/mascotsmile.svg"
          alt="Smiling mascot welcoming you"
          width={96}
          height={96}
          className="mx-auto mb-6 mascot-float"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          You&apos;ve been invited to a Reaction Booth!
        </h1>
        <p className="text-gray-500 mb-4">
          Someone wants to see your reaction to a video.
        </p>
        {reaction.introMessage && (
          <div className="bg-brand-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Their message:</p>
            <p className="text-soft-black italic">
              &ldquo;{reaction.introMessage}&rdquo;
            </p>
          </div>
        )}

        {/* Headphones recommendation */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          <p className="text-sm text-amber-700">
            <strong>Headphones recommended!</strong> Wearing headphones prevents
            the video audio from being picked up by your microphone, resulting
            in a cleaner reaction recording.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">
            Here&apos;s how it works:
          </h3>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-brand-100 text-soft-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </span>
            <p className="text-sm text-gray-600">
              We&apos;ll ask for camera and microphone access to record your
              reaction
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-brand-100 text-soft-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </span>
            <p className="text-sm text-gray-600">
              Press the <strong>Start Recording</strong> button — the video will
              play and your webcam will record at the same time
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-brand-100 text-soft-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </span>
            <p className="text-sm text-gray-600">
              When you&apos;re done, your reaction will be saved and ready to
              watch
            </p>
          </div>
        </div>

        <button
          onClick={() => setStep("recording")}
          className="bg-brand text-soft-black px-8 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Let&apos;s Go!
        </button>

        <p className="text-xs text-gray-400 mt-4">
          For the best experience, use a desktop or laptop computer.
        </p>
      </div>
    );
  }

  if (step === "recording") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DualRecorder
          videoUrl={reaction.videoUrl}
          maxDuration={reaction.maxVideoLength}
          watermarked={reaction.watermarked}
          onRecordingComplete={handleRecordingComplete}
          onError={setError}
        />

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
        <Image
          src="/assets/mascotooh.svg"
          alt="Excited mascot"
          width={80}
          height={80}
          className="mx-auto mb-4 mascot-ooh"
        />
        <div className="w-16 h-16 border-4 border-brand-100 border-t-brand rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Uploading your reaction...
        </h2>
        <p className="text-gray-500 mb-6">
          Hang tight, this won&apos;t take long.
        </p>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
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
      <Image
        src="/assets/mascotjoy.svg"
        alt="Celebrating mascot"
        width={96}
        height={96}
        className="mx-auto mb-6 mascot-joy"
      />
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Reaction recorded!
      </h1>
      <p className="text-gray-500 mb-8">
        Your reaction has been saved! The person who sent you this link can now
        watch it.
      </p>
      <a
        href="/"
        className="text-brand font-medium hover:text-brand-600 transition-colors"
      >
        Back to ReactionBooth
      </a>
    </div>
  );
}
