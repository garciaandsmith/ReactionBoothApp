"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { extractYouTubeId } from "@/lib/youtube";

interface YouTubePlayerProps {
  videoUrl: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export default function YouTubePlayer({
  videoUrl,
  onPlay,
  onPause,
  onEnded,
}: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);
  const videoId = extractYouTubeId(videoUrl);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onReady") {
          setIsReady(true);
        }
        if (data.event === "onStateChange") {
          switch (data.info) {
            case 1:
              onPlay?.();
              break;
            case 2:
              onPause?.();
              break;
            case 0:
              onEnded?.();
              break;
          }
        }
      } catch {
        // Not a JSON message, ignore
      }
    },
    [onPlay, onPause, onEnded]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Fallback: if YouTube postMessage never fires, reveal the player after 3s
  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-500">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {!isReady && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
