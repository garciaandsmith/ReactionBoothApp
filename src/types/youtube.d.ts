declare namespace YT {
  class Player {
    constructor(elementId: string | HTMLElement, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    destroy(): void;
  }

  interface PlayerOptions {
    width?: number | string;
    height?: number | string;
    videoId?: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: PlayerEvent) => void;
    };
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: number;
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
