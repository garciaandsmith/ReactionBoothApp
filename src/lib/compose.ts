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
}

interface TimelineSegment {
  type: "playing" | "paused";
  startMs: number;
  endMs: number;
  ytStartS: number;
  ytEndS: number;
}

const BRAND_HEX = "0x2EE6A6"; // ffmpeg pad-filter format (no #)

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

  // Video compositing — brand color canvas + precise overlay placement
  const isPip = layout.startsWith("pip-");
  const dur = totalDurationS.toFixed(3);

  if (isPip) {
    filters.push(`[ytv]scale=1485:835:force_original_aspect_ratio=increase,crop=1485:835[yt_s]`);
    filters.push(`[1:v]scale=674:380:force_original_aspect_ratio=increase,crop=674:380[wc_s]`);
    filters.push(`color=c=${BRAND_HEX}:s=1920x1080:d=${dur}[canvas]`);
    filters.push(`[canvas][yt_s]overlay=65:65[with_yt]`);

    let wcX: string;
    let wcY: string;
    switch (layout) {
      case "pip-bottom-right": wcX = "1181"; wcY = "635"; break;
      case "pip-bottom-left":  wcX = "65";   wcY = "635"; break;
      case "pip-top-right":    wcX = "1181"; wcY = "65";  break;
      case "pip-top-left":     wcX = "65";   wcY = "65";  break;
      default:                 wcX = "1181"; wcY = "635";
    }
    if (watermark) {
      filters.push(`[with_yt][wc_s]overlay=${wcX}:${wcY}[vid_comp]`);
      filters.push(`[vid_comp][2:v]overlay=70:1023[outv]`);
    } else {
      filters.push(`[with_yt][wc_s]overlay=${wcX}:${wcY}[outv]`);
    }

  } else if (layout === "side-by-side") {
    filters.push(`[ytv]scale=930:540:force_original_aspect_ratio=increase,crop=930:540[yt_s]`);
    filters.push(`[1:v]scale=930:540:force_original_aspect_ratio=increase,crop=930:540[wc_s]`);
    filters.push(`color=c=${BRAND_HEX}:s=1920x1080:d=${dur}[canvas]`);
    filters.push(`[canvas][yt_s]overlay=0:270[with_yt]`);
    if (watermark) {
      filters.push(`[with_yt][wc_s]overlay=990:270[vid_comp]`);
      filters.push(`[vid_comp][2:v]overlay=(W-w)/2:945[outv]`);
    } else {
      filters.push(`[with_yt][wc_s]overlay=990:270[outv]`);
    }

  } else {
    // stacked
    filters.push(`[ytv]scale=1080:920:force_original_aspect_ratio=increase,crop=1080:920[yt_s]`);
    filters.push(`[1:v]scale=1080:920:force_original_aspect_ratio=increase,crop=1080:920[wc_s]`);
    filters.push(`color=c=${BRAND_HEX}:s=1080x1920:d=${dur}[canvas]`);
    filters.push(`[canvas][yt_s]overlay=0:0[with_yt]`);
    if (watermark) {
      filters.push(`[with_yt][wc_s]overlay=0:1000[vid_comp]`);
      filters.push(`[vid_comp][2:v]overlay=(W-w)/2:940[outv]`);
    } else {
      filters.push(`[with_yt][wc_s]overlay=0:1000[outv]`);
    }
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
    cookiesContent,
  } = options;

  if (!ffmpegPath) throw new Error("ffmpeg-static binary not found");

  const watermarkPath = (() => {
    for (const p of [
      "/var/task/public/watermark.png",
      join(process.cwd(), "public/watermark.png"),
    ]) {
      if (existsSync(p)) return p;
    }
    return null;
  })();

  const segments = buildTimeline(eventsLog);
  const totalDurationS = eventsLog.recordingDurationMs / 1000;

  const tempDir = await mkdtemp(join(tmpdir(), "reactionbooth-"));
  const ytPath = join(tempDir, "youtube.mp4");

  try {
    await downloadYouTube(eventsLog.videoUrl, ytPath, cookiesContent);
    const filterGraph = buildFilterGraph(segments, layout, totalDurationS, watermark, volume);

    await execFileAsync(ffmpegPath, [
      "-y",
      "-i", ytPath,
      "-i", webcamPath,
      ...(watermark && watermarkPath ? ["-i", watermarkPath] : []),
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
