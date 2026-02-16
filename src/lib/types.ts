// A single event captured during recording
export interface YouTubeEvent {
  type: "play" | "pause" | "seek" | "ended" | "buffering";
  /** Milliseconds elapsed since recording start */
  timestampMs: number;
  /** YouTube video time in seconds at the moment of the event */
  videoTimeS: number;
}

// The full event log saved alongside the webcam recording
export interface ReactionEventLog {
  version: 1;
  videoId: string;
  videoUrl: string;
  recordingStartedAt: string; // ISO timestamp
  events: YouTubeEvent[];
  /** Total duration of the webcam recording in ms */
  recordingDurationMs: number;
}

// Layout types for the watch/download views
export type WatchLayout = "pip-desktop" | "stacked-mobile";
