import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import type { ReactionEventLog, WatchLayout, ComposeVolumeSettings } from "./types";

const execFileAsync = promisify(execFile);

interface ComposeOptions {
  webcamPath: string;
  eventsLog: ReactionEventLog;
  layout: WatchLayout;
  outputPath: string;
  watermark?: boolean;
  volume?: ComposeVolumeSettings;
}

interface TimelineSegment {
  type: "playing" | "paused";
  startMs: number;
  endMs: number;
  ytStartS: number;
  ytEndS: number;
}

const BRAND_BAR_H = 36;
const BRAND_COLOR = "#6366f1";
const BRAND_HEX = "0x6366f1"; // ffmpeg pad-filter format (no #)
const BRAND_TEXT = "ReactionBooth";

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

export async function downloadYouTube(
  videoUrl: string,
  outputPath: string
): Promise<void> {
  await execFileAsync("yt-dlp", [
    "-f", "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best",
    "--merge-output-format", "mp4",
    "-o", outputPath,
    "--no-playlist",
    "--no-check-certificates",
    videoUrl,
  ], { timeout: 120000 });
}

function buildTimeline(events: ReactionEventLog): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  const sortedEvents = [...events.events].sort((a, b) => a.timestampMs - b.timestampMs);
  const totalDurationMs = events.recordingDurationMs;

  if (sortedEvents.length === 0) return segments;

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

  let currentYtTime = 0;

  for (let i = 0; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];
    const segmentEndMs = nextEvent ? nextEvent.timestampMs : totalDurationMs;

    if (event.type === "play") {
      currentYtTime = event.videoTimeS;
      const durationMs = segmentEndMs - event.timestampMs;
      segments.push({
        type: "playing",
        startMs: event.timestampMs,
        endMs: segmentEndMs,
        ytStartS: currentYtTime,
        ytEndS: currentYtTime + durationMs / 1000,
      });
    } else if (event.type === "pause" || event.type === "ended") {
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
    }
  }

  return segments;
}

function buildFilterGraph(
  segments: TimelineSegment[],
  layout: WatchLayout,
  totalDurationS: number,
  watermark: boolean,
  volume: ComposeVolumeSettings
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
      filters.push(
        `[0:v]trim=start=${seg.ytStartS.toFixed(3)}:duration=${durationS.toFixed(3)},setpts=PTS-STARTPTS[${vLabel}]`
      );
      filters.push(
        `[0:a]atrim=start=${seg.ytStartS.toFixed(3)}:duration=${durationS.toFixed(3)},asetpts=PTS-STARTPTS[${aLabel}]`
      );
    } else {
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
    filters.push(`[0:v]setpts=PTS-STARTPTS[ytv]`);
    filters.push(`[0:a]asetpts=PTS-STARTPTS[yta]`);
  } else if (segLabels.length === 1) {
    filters.push(`[seg0v]setpts=PTS-STARTPTS[ytv]`);
    filters.push(`[seg0a]asetpts=PTS-STARTPTS[yta]`);
  } else {
    filters.push(
      `${segLabels.join("")}concat=n=${segLabels.length}:v=1:a=1[ytv][yta]`
    );
  }

  // Audio: normalize + user volume
  const ytVol = (volume.youtubeVolume / 100).toFixed(2);
  const wcVol = (volume.webcamVolume / 100).toFixed(2);
  filters.push(`[yta]loudnorm=I=-16:TP=-1.5:LRA=11,volume=${ytVol}[yt_audio]`);
  filters.push(`[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,volume=${wcVol}[wc_audio]`);
  filters.push(`[yt_audio][wc_audio]amix=inputs=2:duration=shortest:dropout_transition=2[outa]`);

  // Video compositing
  const isPip = layout.startsWith("pip-");
  const alpha = watermark ? "white" : "white@0.6";
  const dur = totalDurationS.toFixed(3);

  if (isPip) {
    // Output: 1920×1080. Content area: 1920×1044. Brand bar: 1920×36 at bottom.
    const pipW = 480; // 25% of canvas width, 16:9
    const pipH = 270;
    filters.push(`[ytv]scale=1920:1044:force_original_aspect_ratio=decrease,pad=1920:1044:(ow-iw)/2:(oh-ih)/2:${BRAND_HEX}[bg]`);
    filters.push(`[1:v]scale=${pipW}:${pipH}:force_original_aspect_ratio=decrease,pad=${pipW}:${pipH}:(ow-iw)/2:(oh-ih)/2:${BRAND_HEX}[pip]`);

    let overlayPos: string;
    switch (layout) {
      case "pip-bottom-right": overlayPos = "W-w-16:H-h-16"; break;
      case "pip-bottom-left":  overlayPos = "16:H-h-16"; break;
      case "pip-top-right":    overlayPos = "W-w-16:16"; break;
      case "pip-top-left":     overlayPos = "16:16"; break;
      default:                 overlayPos = "W-w-16:H-h-16";
    }

    filters.push(`[bg][pip]overlay=${overlayPos}[vidcomp]`);
    filters.push(`color=c=${BRAND_COLOR}:s=1920x${BRAND_BAR_H}:d=${dur}[brand_bar]`);
    filters.push(`[brand_bar]drawtext=text='${BRAND_TEXT}':fontsize=16:fontcolor=${alpha}:x=(w-text_w)/2:y=(h-text_h)/2[brand_text]`);
    filters.push(`[vidcomp][brand_text]vstack=inputs=2[outv]`);

  } else if (layout === "side-by-side") {
    // Output: 1920×1080. Slots: 960×1044 each. Brand bar: 1920×36 at bottom.
    filters.push(`[ytv]scale=960:1044:force_original_aspect_ratio=decrease,pad=960:1044:(ow-iw)/2:(oh-ih)/2:${BRAND_HEX}[left]`);
    filters.push(`[1:v]scale=960:1044:force_original_aspect_ratio=decrease,pad=960:1044:(ow-iw)/2:(oh-ih)/2:${BRAND_HEX}[right]`);
    filters.push(`[left][right]hstack=inputs=2[vidcomp]`);
    filters.push(`color=c=${BRAND_COLOR}:s=1920x${BRAND_BAR_H}:d=${dur}[brand_bar]`);
    filters.push(`[brand_bar]drawtext=text='${BRAND_TEXT}':fontsize=16:fontcolor=${alpha}:x=(w-text_w)/2:y=(h-text_h)/2[brand_text]`);
    filters.push(`[vidcomp][brand_text]vstack=inputs=2[outv]`);

  } else {
    // stacked — Output: 1080×1920. Slots: 1080×942 each. Brand bar: 1080×36 in middle.
    // 942 + 36 + 942 = 1920 ✓
    filters.push(`[ytv]scale=1080:942:force_original_aspect_ratio=decrease,pad=1080:942:(ow-iw)/2:(oh-ih)/2:${BRAND_HEX}[top]`);
    filters.push(`[1:v]scale=1080:942:force_original_aspect_ratio=decrease,pad=1080:942:(ow-iw)/2:(oh-ih)/2:${BRAND_HEX}[bottom]`);
    filters.push(`color=c=${BRAND_COLOR}:s=1080x${BRAND_BAR_H}:d=${dur}[brand_bar]`);
    filters.push(`[brand_bar]drawtext=text='${BRAND_TEXT}':fontsize=16:fontcolor=${alpha}:x=(w-text_w)/2:y=(h-text_h)/2[brand_text]`);
    filters.push(`[top][brand_text][bottom]vstack=inputs=3[outv]`);
  }

  return filters.join(";\n");
}

export async function composeReaction(options: ComposeOptions): Promise<void> {
  const {
    webcamPath,
    eventsLog,
    layout,
    outputPath,
    watermark = false,
    volume = { youtubeVolume: 100, webcamVolume: 100 },
  } = options;

  const segments = buildTimeline(eventsLog);
  const totalDurationS = eventsLog.recordingDurationMs / 1000;

  const tempDir = await mkdtemp(join(tmpdir(), "reactionbooth-"));
  const ytPath = join(tempDir, "youtube.mp4");

  try {
    await downloadYouTube(eventsLog.videoUrl, ytPath);
    const filterGraph = buildFilterGraph(segments, layout, totalDurationS, watermark, volume);

    await execFileAsync("ffmpeg", [
      "-y",
      "-i", ytPath,
      "-i", webcamPath,
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
    ], { timeout: 600000 });
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
