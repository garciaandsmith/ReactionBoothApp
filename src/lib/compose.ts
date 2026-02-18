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

  // Video compositing — brand color canvas + precise overlay placement
  const isPip = layout.startsWith("pip-");
  const dur = totalDurationS.toFixed(3);
  // Watermark: fully opaque for free tier, subtle for pro (always present as branding)
  const wmColor = watermark ? "white" : "white@0.5";

  if (isPip) {
    // Canvas: 1920×1080 brand color
    // YouTube: 1485×835 at (65, 65) — top-left, 65 px margin
    // Webcam:  674×380 at corner, 65 px margin from edges
    filters.push(`[ytv]scale=1485:835:force_original_aspect_ratio=increase,crop=1485:835[yt_s]`);
    filters.push(`[1:v]scale=674:380:force_original_aspect_ratio=increase,crop=674:380[wc_s]`);
    filters.push(`color=c=${BRAND_HEX}:s=1920x1080:d=${dur}[canvas]`);
    filters.push(`[canvas][yt_s]overlay=65:65[with_yt]`);

    // Webcam corner positions (65 px margin; canvas 1920×1080, webcam 674×380)
    // right edge: 1920 - 65 - 674 = 1181  |  bottom edge: 1080 - 65 - 380 = 635
    let wcX: string;
    let wcY: string;
    switch (layout) {
      case "pip-bottom-right": wcX = "1181"; wcY = "635"; break;
      case "pip-bottom-left":  wcX = "65";   wcY = "635"; break;
      case "pip-top-right":    wcX = "1181"; wcY = "65";  break;
      case "pip-top-left":     wcX = "65";   wcY = "65";  break;
      default:                 wcX = "1181"; wcY = "635";
    }
    filters.push(`[with_yt][wc_s]overlay=${wcX}:${wcY}[vid_comp]`);

    // Watermark text in the bottom-left brand color strip (below YouTube at y≈900, left of webcam)
    filters.push(
      `[vid_comp]drawtext=text='${BRAND_TEXT}':fontsize=20:fontcolor=${wmColor}:x=70:y=1023[outv]`
    );

  } else if (layout === "side-by-side") {
    // Canvas: 1920×1080 brand color
    // YouTube: 930×540 center-crop, at (0, 270)   — flush left, centered vertically
    // Webcam:  930×540 center-crop, at (990, 270)  — flush right, centered vertically
    // Brand color visible: 60 px center divider (x=930–990), 270 px top/bottom borders
    filters.push(`[ytv]scale=930:540:force_original_aspect_ratio=increase,crop=930:540[yt_s]`);
    filters.push(`[1:v]scale=930:540:force_original_aspect_ratio=increase,crop=930:540[wc_s]`);
    filters.push(`color=c=${BRAND_HEX}:s=1920x1080:d=${dur}[canvas]`);
    filters.push(`[canvas][yt_s]overlay=0:270[with_yt]`);
    filters.push(`[with_yt][wc_s]overlay=990:270[vid_comp]`);

    // Watermark text centered in the bottom border (y≈945, center of the 270 px bottom strip)
    filters.push(
      `[vid_comp]drawtext=text='${BRAND_TEXT}':fontsize=20:fontcolor=${wmColor}:x=(w-text_w)/2:y=945[outv]`
    );

  } else {
    // stacked — Canvas: 1080×1920 brand color
    // YouTube: 1080×920 center-crop, at (0, 0)    — flush top
    // Webcam:  1080×920 center-crop, at (0, 1000) — flush bottom (920 + 80 gap = 1000)
    // Brand color visible: 80 px horizontal bar at y=920–1000 (vertical middle)
    filters.push(`[ytv]scale=1080:920:force_original_aspect_ratio=increase,crop=1080:920[yt_s]`);
    filters.push(`[1:v]scale=1080:920:force_original_aspect_ratio=increase,crop=1080:920[wc_s]`);
    filters.push(`color=c=${BRAND_HEX}:s=1080x1920:d=${dur}[canvas]`);
    filters.push(`[canvas][yt_s]overlay=0:0[with_yt]`);
    filters.push(`[with_yt][wc_s]overlay=0:1000[vid_comp]`);

    // Watermark text centered in the 80 px middle bar (center = y=960)
    filters.push(
      `[vid_comp]drawtext=text='${BRAND_TEXT}':fontsize=20:fontcolor=${wmColor}:x=(w-text_w)/2:y=940[outv]`
    );
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
