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

// Layout types for composited downloads
export type WatchLayout =
  | "pip-bottom-right"
  | "pip-bottom-left"
  | "pip-top-right"
  | "pip-top-left"
  | "side-by-side"
  | "stacked";

// Volume settings for compositing
export interface ComposeVolumeSettings {
  /** YouTube audio volume 0-200 */
  youtubeVolume: number;
  /** Webcam/mic audio volume 0-200 */
  webcamVolume: number;
}
