import { execFile } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { existsSync } from "fs";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { downloadWithYtDlp } from "./ytdlp";
import type { ReactionEventLog, WatchLayout, ComposeVolumeSettings } from "./types";

// Resolve the ffmpeg binary path without relying on __dirname — webpack
// mangles __dirname to the bundle output directory when it bundles
// ffmpeg-static, producing a nonsense path like:
//   /var/task/.next/server/app/api/reactions/[id]/compose/ffmpeg
// Instead we probe the filesystem at known locations directly.
// outputFileTracingIncludes in next.config.mjs ensures the binary is copied
// into the Vercel Lambda package at /var/task/node_modules/ffmpeg-static/.
const ffmpegPath: string | null = (() => {
  for (const p of [
    "/var/task/node_modules/ffmpeg-static/ffmpeg", // Vercel / AWS Lambda
    join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg"), // local dev
  ]) {
    if (existsSync(p)) return p;
  }
  return null;
})();

const execFileAsync = promisify(execFile);

interface ComposeOptions {
  webcamPath: string;
  eventsLog: ReactionEventLog;
  layout: WatchLayout;
  outputPath: string;
  watermark?: boolean;
  volume?: ComposeVolumeSettings;
  /** Netscape-format cookie content from the admin DB setting. */
  cookiesContent?: string;
  /** Append a 3-second off-white closing slide (for free-tier users). */
  closingSlide?: boolean;
  /**
   * Absolute path to a local image file used as the canvas background.
   * When omitted, the brand teal colour fill is used instead.
   * Corresponds to the admin-set `default_bg_{layout}` SiteSettings value.
   * In the future this may also be overridden per-user for PRO plans.
   */
  backgroundImagePath?: string;
}

interface TimelineSegment {
  type: "playing" | "paused";
  startMs: number;
  endMs: number;
  ytStartS: number;
  ytEndS: number;
}

const BRAND_HEX = "0x2EE6A6"; // ffmpeg pad-filter format (no #)

// New PIP layout pixel values for 1920×1080 canvas:
//   Main video : 1750×977  at  (85, 75)
//   PIP video  :  550×310  flush to canvas corner
const PIP_MAIN = { x: 85, y: 75, w: 1750, h: 977 };
const PIP_SMALL = { w: 550, h: 310 };

export async function downloadYouTube(
  videoUrl: string,
  outputPath: string,
  cookiesContent?: string
): Promise<void> {
  await downloadWithYtDlp(videoUrl, outputPath, cookiesContent);
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
  volume: ComposeVolumeSettings,
  closingSlide: boolean,
  hasBackgroundImage: boolean
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

  // Video compositing — brand color canvas + precise overlay placement
  const dur = totalDurationS.toFixed(3);

  // bgInput is the ffmpeg input index for the background image (when used).
  // [0:v] = YouTube, [1:v] = webcam, [2:v] = background image (optional).
  const bgIdx = 2;

  function canvasFilter(w: number, h: number): string {
    if (hasBackgroundImage) {
      return `[${bgIdx}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}[canvas]`;
    }
    return `color=c=${BRAND_HEX}:s=${w}x${h}:d=${dur}[canvas]`;
  }

  if (layout.startsWith("pip-") && layout !== "pip-cam-bottom-right") {
    // Standard PIP: YT is large main, webcam is small PIP
    const { x: mx, y: my, w: mw, h: mh } = PIP_MAIN;
    const { w: pw, h: ph } = PIP_SMALL;
    filters.push(`[ytv]scale=${mw}:${mh}:force_original_aspect_ratio=increase,crop=${mw}:${mh}[yt_s]`);
    filters.push(`[1:v]scale=${pw}:${ph}:force_original_aspect_ratio=increase,crop=${pw}:${ph}[wc_s]`);
    filters.push(canvasFilter(1920, 1080));
    filters.push(`[canvas][yt_s]overlay=${mx}:${my}[with_yt]`);

    // PIP position (webcam): corners align with main video edges (not canvas edges)
    const mainR = PIP_MAIN.x + PIP_MAIN.w; // 1835
    const mainB = PIP_MAIN.y + PIP_MAIN.h; // 1052
    let wcX: number, wcY: number;
    switch (layout) {
      case "pip-bottom-right": wcX = mainR - pw; wcY = mainB - ph; break; // 1285, 742
      case "pip-bottom-left":  wcX = PIP_MAIN.x; wcY = mainB - ph; break; // 85, 742
      case "pip-top-right":    wcX = mainR - pw; wcY = PIP_MAIN.y; break; // 1285, 75
      case "pip-top-left":     wcX = PIP_MAIN.x; wcY = PIP_MAIN.y; break; // 85, 75
      default:                 wcX = mainR - pw; wcY = mainB - ph;
    }
    filters.push(`[with_yt][wc_s]overlay=${wcX}:${wcY}[outv]`);

  } else if (layout === "pip-cam-bottom-right") {
    // Inverted PIP: webcam is large main, YT is small PIP aligned to main video corner
    const { x: mx, y: my, w: mw, h: mh } = PIP_MAIN;
    const { w: pw, h: ph } = PIP_SMALL;
    const mainR = mx + mw; // 1835
    const mainB = my + mh; // 1052
    filters.push(`[1:v]scale=${mw}:${mh}:force_original_aspect_ratio=increase,crop=${mw}:${mh}[wc_s]`);
    filters.push(`[ytv]scale=${pw}:${ph}:force_original_aspect_ratio=increase,crop=${pw}:${ph}[yt_s]`);
    filters.push(canvasFilter(1920, 1080));
    filters.push(`[canvas][wc_s]overlay=${mx}:${my}[with_wc]`);
    filters.push(`[with_wc][yt_s]overlay=${mainR - pw}:${mainB - ph}[outv]`);

  } else if (layout === "side-by-side") {
    filters.push(`[ytv]scale=930:540:force_original_aspect_ratio=increase,crop=930:540[yt_s]`);
    filters.push(`[1:v]scale=930:540:force_original_aspect_ratio=increase,crop=930:540[wc_s]`);
    filters.push(canvasFilter(1920, 1080));
    filters.push(`[canvas][yt_s]overlay=0:270[with_yt]`);
    filters.push(`[with_yt][wc_s]overlay=990:270[outv]`);

  } else {
    // stacked (portrait 1080×1920)
    filters.push(`[ytv]scale=1080:920:force_original_aspect_ratio=increase,crop=1080:920[yt_s]`);
    filters.push(`[1:v]scale=1080:920:force_original_aspect_ratio=increase,crop=1080:920[wc_s]`);
    filters.push(canvasFilter(1080, 1920));
    filters.push(`[canvas][yt_s]overlay=0:0[with_yt]`);
    filters.push(`[with_yt][wc_s]overlay=0:1000[outv]`);
  }

  // ── Closing slide (3 seconds, off-white background) ───────────────────
  // Appended after the main reaction content for free-tier users.
  if (closingSlide) {
    const isStacked = layout === "stacked";
    const cSize = isStacked ? "1080x1920" : "1920x1080";
    filters.push(`color=c=0xF7F9F8:s=${cSize}:d=3.000[closing_v]`);
    filters.push(`anullsrc=channel_layout=stereo:sample_rate=44100,atrim=duration=3.000[closing_a]`);
    filters.push(`[outv][closing_v]concat=n=2:v=1:a=0[final_v]`);
    filters.push(`[outa][closing_a]concat=n=2:v=0:a=1[final_a]`);
  }

  return filters.join(";\n");
}

export async function composeReaction(options: ComposeOptions): Promise<void> {
  const {
    webcamPath,
    eventsLog,
    layout,
    outputPath,
    volume = { youtubeVolume: 100, webcamVolume: 100 },
    cookiesContent,
    closingSlide = false,
    backgroundImagePath,
  } = options;

  if (!ffmpegPath) throw new Error("ffmpeg-static binary not found");

  const segments = buildTimeline(eventsLog);
  const totalDurationS = eventsLog.recordingDurationMs / 1000;

  const tempDir = await mkdtemp(join(tmpdir(), "reactionbooth-"));
  const ytPath = join(tempDir, "youtube.mp4");

  // Output label names depend on whether a closing slide was appended
  const videoMap = closingSlide ? "[final_v]" : "[outv]";
  const audioMap = closingSlide ? "[final_a]" : "[outa]";
  // Total encoded duration includes the closing slide
  const encodeDuration = closingSlide ? totalDurationS + 3 : totalDurationS;

  try {
    await downloadYouTube(eventsLog.videoUrl, ytPath, cookiesContent);
    const filterGraph = buildFilterGraph(segments, layout, totalDurationS, volume, closingSlide, !!backgroundImagePath);

    // Build input list: YT video, webcam, and optionally the background image.
    // -loop 1 causes ffmpeg to repeat the static image for the full duration.
    const inputArgs: string[] = ["-i", ytPath, "-i", webcamPath];
    if (backgroundImagePath) {
      inputArgs.push("-loop", "1", "-i", backgroundImagePath);
    }

    await execFileAsync(ffmpegPath, [
      "-y",
      ...inputArgs,
      "-filter_complex", filterGraph,
      "-map", videoMap,
      "-map", audioMap,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-t", encodeDuration.toFixed(3),
      outputPath,
    ], { timeout: 600000 });
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
