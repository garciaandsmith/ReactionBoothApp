import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { mkdtemp, readFile, rm, access } from "fs/promises";
import { tmpdir } from "os";
import type { ReactionEventLog, WatchLayout } from "./types";

const execFileAsync = promisify(execFile);

interface ComposeOptions {
  webcamPath: string; // absolute path to webcam .webm
  eventsLog: ReactionEventLog;
  layout: WatchLayout;
  outputPath: string; // absolute path for output .mp4
  watermark?: boolean;
}

interface TimelineSegment {
  type: "playing" | "paused";
  startMs: number; // start in recording timeline
  endMs: number; // end in recording timeline
  ytStartS: number; // YouTube time at segment start
  ytEndS: number; // YouTube time at segment end (same as start for paused)
}

// Check if a command is available
async function commandExists(cmd: string): Promise<boolean> {
  try {
    await execFileAsync(process.platform === "win32" ? "where" : "which", [cmd]);
    return true;
  } catch {
    return false;
  }
}

export async function checkDependencies(): Promise<{ ffmpeg: boolean; ytdlp: boolean }> {
  const [ffmpeg, ytdlp] = await Promise.all([
    commandExists("ffmpeg"),
    commandExists("yt-dlp"),
  ]);
  return { ffmpeg, ytdlp };
}

// Download YouTube video using yt-dlp
export async function downloadYouTube(
  videoUrl: string,
  outputPath: string
): Promise<void> {
  // Download best quality mp4 (h264+aac) for FFmpeg compatibility
  await execFileAsync("yt-dlp", [
    "-f", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best",
    "--merge-output-format", "mp4",
    "-o", outputPath,
    "--no-playlist",
    "--no-check-certificates",
    videoUrl,
  ], { timeout: 120000 }); // 2 min timeout
}

// Build timeline segments from event log
function buildTimeline(events: ReactionEventLog): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const sortedEvents = [...events.events].sort((a, b) => a.timestampMs - b.timestampMs);
  const totalDurationMs = events.recordingDurationMs;

  if (sortedEvents.length === 0) return segments;

  // If recording starts before first play, add a paused segment
  const firstEvent = sortedEvents[0];
  if (firstEvent.timestampMs > 0) {
    segments.push({
      type: "paused",
      startMs: 0,
      endMs: firstEvent.timestampMs,
      ytStartS: firstEvent.videoTimeS,
      ytEndS: firstEvent.videoTimeS,
    });
  }

  let isPlaying = false;
  let currentYtTime = 0;
  let segmentStartMs = firstEvent.timestampMs;

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];
    const segmentEndMs = nextEvent ? nextEvent.timestampMs : totalDurationMs;

    if (event.type === "play") {
      isPlaying = true;
      currentYtTime = event.videoTimeS;
      segmentStartMs = event.timestampMs;

      const durationMs = segmentEndMs - segmentStartMs;
      segments.push({
        type: "playing",
        startMs: segmentStartMs,
        endMs: segmentEndMs,
        ytStartS: currentYtTime,
        ytEndS: currentYtTime + durationMs / 1000,
      });
    } else if (event.type === "pause" || event.type === "ended") {
      isPlaying = false;
      currentYtTime = event.videoTimeS;

      if (segmentEndMs > event.timestampMs) {
        segments.push({
          type: "paused",
          startMs: event.timestampMs,
          endMs: segmentEndMs,
          ytStartS: currentYtTime,
          ytEndS: currentYtTime,
        });
      }
    } else if (event.type === "seek") {
      currentYtTime = event.videoTimeS;
    } else if (event.type === "buffering") {
      // Treat buffering as a brief pause — the next play event resumes
    }
  }

  return segments;
}

// Build the FFmpeg filter graph for timeline reconstruction + compositing
function buildFilterGraph(
  segments: TimelineSegment[],
  layout: WatchLayout,
  totalDurationS: number,
  watermark: boolean
): string {
  const filters: string[] = [];
  const segLabels: string[] = [];
  let segIdx = 0;

  for (const seg of segments) {
    const durationS = (seg.endMs - seg.startMs) / 1000;
    if (durationS <= 0) continue;

    const vLabel = `seg${segIdx}v`;
    const aLabel = `seg${segIdx}a`;

    if (seg.type === "playing") {
      // Trim YouTube video for this playing segment
      filters.push(
        `[0:v]trim=start=${seg.ytStartS.toFixed(3)}:duration=${durationS.toFixed(3)},setpts=PTS-STARTPTS[${vLabel}]`
      );
      filters.push(
        `[0:a]atrim=start=${seg.ytStartS.toFixed(3)}:duration=${durationS.toFixed(3)},asetpts=PTS-STARTPTS[${aLabel}]`
      );
    } else {
      // Paused: freeze frame at ytStartS
      filters.push(
        `[0:v]trim=start=${seg.ytStartS.toFixed(3)}:end=${(seg.ytStartS + 0.04).toFixed(3)},setpts=PTS-STARTPTS,tpad=stop_duration=${durationS.toFixed(3)}:stop_mode=clone,setpts=PTS-STARTPTS[${vLabel}]`
      );
      filters.push(
        `anullsrc=channel_layout=stereo:sample_rate=44100,atrim=duration=${durationS.toFixed(3)}[${aLabel}]`
      );
    }

    segLabels.push(`[${vLabel}][${aLabel}]`);
    segIdx++;
  }

  if (segLabels.length === 0) {
    // Fallback: use entire YouTube video
    filters.push(`[0:v]setpts=PTS-STARTPTS[ytv]`);
    filters.push(`[0:a]asetpts=PTS-STARTPTS[yta]`);
  } else if (segLabels.length === 1) {
    // Single segment — rename to ytv/yta
    const vLabel = `seg0v`;
    const aLabel = `seg0a`;
    filters.push(`[${vLabel}]setpts=PTS-STARTPTS[ytv]`);
    filters.push(`[${aLabel}]asetpts=PTS-STARTPTS[yta]`);
  } else {
    // Concatenate all segments
    filters.push(
      `${segLabels.join("")}concat=n=${segLabels.length}:v=1:a=1[ytv][yta]`
    );
  }

  // Now composite based on layout
  if (layout === "pip-desktop") {
    // Scale YouTube to 1280x720, webcam to 320x180, overlay in bottom-right
    filters.push(`[ytv]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black[bg]`);
    filters.push(`[1:v]scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2:black[pip]`);
    filters.push(`[bg][pip]overlay=W-w-16:H-h-16[compv]`);

    if (watermark) {
      filters.push(
        `[compv]drawtext=text='ReactionBooth':fontsize=18:fontcolor=white@0.5:x=16:y=16[outv]`
      );
    } else {
      filters.push(`[compv]copy[outv]`);
    }
  } else {
    // Stacked mobile: YouTube top (720x406), bar (720x40), webcam bottom (720x406)
    filters.push(`[ytv]scale=720:406:force_original_aspect_ratio=decrease,pad=720:406:(ow-iw)/2:(oh-ih)/2:black[top]`);
    filters.push(`[1:v]scale=720:406:force_original_aspect_ratio=decrease,pad=720:406:(ow-iw)/2:(oh-ih)/2:black[bottom]`);
    filters.push(`color=c=#6366f1:s=720x40:d=${totalDurationS.toFixed(3)}[bar]`);

    if (watermark) {
      filters.push(
        `[bar]drawtext=text='ReactionBooth':fontsize=20:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2[bartext]`
      );
      filters.push(`[top][bartext][bottom]vstack=inputs=3[outv]`);
    } else {
      filters.push(`[top][bar][bottom]vstack=inputs=3[outv]`);
    }
  }

  // Mix audio: YouTube audio + webcam mic audio
  filters.push(`[yta][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[outa]`);

  return filters.join(";\n");
}

// Main compositing function
export async function composeReaction(options: ComposeOptions): Promise<void> {
  const { webcamPath, eventsLog, layout, outputPath, watermark = false } = options;

  // Build timeline
  const segments = buildTimeline(eventsLog);
  const totalDurationS = eventsLog.recordingDurationMs / 1000;

  // Download YouTube video to temp dir
  const tempDir = await mkdtemp(join(tmpdir(), "reactionbooth-"));
  const ytPath = join(tempDir, "youtube.mp4");

  try {
    await downloadYouTube(eventsLog.videoUrl, ytPath);

    // Build filter graph
    const filterGraph = buildFilterGraph(segments, layout, totalDurationS, watermark);

    // Run FFmpeg
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", ytPath, // input 0: YouTube video
      "-i", webcamPath, // input 1: webcam recording
      "-filter_complex", filterGraph,
      "-map", "[outv]",
      "-map", "[outa]",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-t", totalDurationS.toFixed(3),
      outputPath,
    ], { timeout: 600000 }); // 10 min timeout
  } finally {
    // Clean up temp dir
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
