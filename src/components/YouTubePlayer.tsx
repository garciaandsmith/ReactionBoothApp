"use client";

import {
  useRef,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { extractYouTubeId } from "@/lib/youtube";

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
}

interface YouTubePlayerProps {
  videoUrl: string;
  /** When true, an overlay blocks direct YouTube interaction */
  controlledMode?: boolean;
  onStateChange?: (state: number, videoTime: number) => void;
  onReady?: () => void;
}

// Module-level: shared promise for loading the YouTube IFrame API script once
let ytApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<void>((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  function YouTubePlayer({ videoUrl, controlledMode, onStateChange, onReady }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YT.Player | null>(null);
    const [isReady, setIsReady] = useState(false);
    const videoId = extractYouTubeId(videoUrl);

    // Stable refs for callbacks to avoid re-creating the player
    const onStateChangeRef = useRef(onStateChange);
    onStateChangeRef.current = onStateChange;
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seekTo: (s: number) => playerRef.current?.seekTo(s, true),
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
      getDuration: () => playerRef.current?.getDuration() ?? 0,
      getPlayerState: () => playerRef.current?.getPlayerState() ?? -1,
    }));

    const initPlayer = useCallback(async () => {
      if (!videoId || !containerRef.current) return;

      await loadYouTubeApi();

      // Destroy previous player if re-initializing
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      // The API replaces a child div with the iframe
      const targetDiv = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(targetDiv);

      playerRef.current = new YT.Player(targetDiv, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: controlledMode ? 0 : 1,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            onReadyRef.current?.();
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            const videoTime = playerRef.current?.getCurrentTime() ?? 0;
            onStateChangeRef.current?.(event.data, videoTime);
          },
        },
      });
    }, [videoId, controlledMode]);

    useEffect(() => {
      initPlayer();
      return () => {
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [initPlayer]);

    if (!videoId) {
      return (
        <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
          <p className="text-gray-500">Invalid video URL</p>
        </div>
      );
    }

    return (
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {controlledMode && isReady && (
          <div className="absolute inset-0 z-10" />
        )}

        {!isReady && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
);

export default YouTubePlayer;
