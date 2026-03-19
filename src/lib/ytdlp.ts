import { join } from "path";
import { tmpdir } from "os";
import { chmod, stat, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import YTDlpWrap from "yt-dlp-wrap";

// Locate the ffmpeg-static binary so yt-dlp can merge DASH streams.
// Without this, any video that YouTube serves as separate video+audio tracks
// (the vast majority of HD content) fails with "Requested format is not available".
const FFMPEG_PATH: string | null = (() => {
  for (const p of [
    "/var/task/node_modules/ffmpeg-static/ffmpeg",          // Vercel Lambda
    join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg"), // local dev
  ]) {
    if (existsSync(p)) return p;
  }
  return null;
})();

// Binary is cached in /tmp between warm Lambda invocations.
const BINARY_PATH = join(tmpdir(), "yt-dlp");
// Re-download the binary if the cached copy is older than this threshold.
// YouTube regularly changes its internal API; an outdated binary produces
// "Requested format is not available" for every format selector.
const BINARY_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

// Cookies are written here whenever the content changes.
const COOKIES_PATH = join(tmpdir(), "yt-dlp-cookies.txt");

// Module-level singletons.
let _binaryReady: Promise<string> | null = null;
// Track the last cookies content written so we only rewrite on change.
let _cookiesContent: string | null = null;

const STANDALONE_URLS: Partial<Record<NodeJS.Architecture, string>> = {
  x64:   "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux",
  arm64: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64",
};

async function downloadBinary(): Promise<string> {
  const standaloneUrl =
    process.platform === "linux" ? STANDALONE_URLS[process.arch] : undefined;
  if (standaloneUrl) {
    await YTDlpWrap.downloadFile(standaloneUrl, BINARY_PATH);
  } else {
    await YTDlpWrap.downloadFromGithub(BINARY_PATH);
  }
  await chmod(BINARY_PATH, 0o755);
  return BINARY_PATH;
}

/**
 * Returns a ready yt-dlp binary path, downloading or re-downloading as needed.
 * If the cached binary is older than BINARY_MAX_AGE_MS it is deleted and
 * replaced with the latest release *before* any download request is attempted,
 * so we never silently use an outdated binary.
 */
async function getBinary(): Promise<string> {
  if (_binaryReady) {
    try {
      const s = await stat(BINARY_PATH);
      if (Date.now() - s.mtimeMs > BINARY_MAX_AGE_MS) {
        console.log("[yt-dlp] cached binary is >6 h old — fetching latest release");
        await unlink(BINARY_PATH).catch(() => {});
        _binaryReady = null;
      }
    } catch {
      _binaryReady = null; // file removed externally — re-download
    }
  }

  if (!_binaryReady) {
    _binaryReady = downloadBinary().catch((err) => {
      _binaryReady = null;
      throw err;
    });
  }
  return _binaryReady;
}

/**
 * Write cookies to /tmp if the content has changed since the last write.
 * Accepts an explicit cookies string (from the DB) or falls back to the
 * YOUTUBE_COOKIES env variable.  Returns the file path, or null if no
 * cookies are available.
 */
async function getCookiesPath(overrideCookies?: string): Promise<string | null> {
  const cookies = overrideCookies ?? process.env.YOUTUBE_COOKIES;
  if (!cookies) return null;

  // Skip writing only if content is unchanged AND the file still exists on
  // disk.  /tmp can be cleared while module state persists on a warm instance,
  // which would leave the cached path pointing at a non-existent file.
  if (cookies === _cookiesContent) {
    try {
      await stat(COOKIES_PATH);
      return COOKIES_PATH; // file confirmed present, content unchanged
    } catch {
      // file missing — fall through to re-write
    }
  }

  await writeFile(COOKIES_PATH, cookies, "utf8");
  _cookiesContent = cookies;
  return COOKIES_PATH;
}

/**
 * Returns true for errors that indicate the video itself is permanently
 * unavailable — no point retrying with a different player client.
 */
function isPermanentError(message: string): boolean {
  return [
    "Video unavailable",
    "Private video",
    "This video is not available",
    "removed by the uploader",
    "This video has been removed",
    "members-only",
    "sign in to confirm your age",
    // Bot-detection: switching player clients can't change the server IP.
    "confirm you're not a bot",
    // Region / copyright restrictions never resolve with a different client.
    "not available in your country",
    "not available in your region",
  ].some((s) => message.toLowerCase().includes(s.toLowerCase()));
}

// Player clients tried in order — tuned for datacenter IPs (Vercel/AWS Lambda).
//
// Client landscape as of March 2026:
//
//   REMOVED in yt-dlp 2026.01.31: tv_embedded, web_embedded, ios_downgraded.
//
//   "web" is now the first thing to try when valid cookies are present.
//   YouTube's own browser client with authenticated cookies bypasses the
//   GVS PO-Token experiment that blocks android_vr/ios from datacenter IPs.
//   Prior belief that web was "SABR-only" was inaccurate: with real session
//   cookies yt-dlp still receives direct DASH/progressive URLs.
//
//   "web,android_vr" (comma-separated) is a yt-dlp 2025.07+ feature: it
//   merges format lists from multiple clients in a single request, increasing
//   the chance of finding a downloadable format without a PO Token.
//
//   android_vr   — used to be best for datacenter IPs (no POT needed), but
//                  YouTube has tightened restrictions; keep as a fallback.
//   tv_downgraded — tolerates datacenter IPs; good with logged-in cookies.
//   null (auto)  — yt-dlp picks the best available client for the environment.
//   ios          — partial; fewer format restrictions than pure web clients.
//   web_creator  — YouTube Studio client; often bypasses standard restrictions.
//   mweb         — last resort; still returns some format metadata even when
//                  all stream URLs require a PO Token.
const PLAYER_CLIENTS = [
  "web",
  "web,android_vr",  // multi-client merge (yt-dlp 2025.07+)
  "android_vr",
  "tv_downgraded",
  null,
  "ios",
  "web_creator",
  "mweb",
] as const;
type PlayerClient = (typeof PLAYER_CLIENTS)[number];
const RETRY_DELAY_MS = 2_000;

// formats=missing_pot: instructs yt-dlp to expose format entries even when
// they are missing a Proof-of-Origin (PO) token.  Without this flag yt-dlp
// silently drops formats that lack a POT, leaving an empty format list and
// causing "Requested format is not available" even when YouTube did return
// format metadata.  Applies globally — it never causes harm.
const BASE_EXTRACTOR_ARGS = "youtube:formats=missing_pot";

function buildExtractorArgs(client: PlayerClient): string {
  if (client === null) return BASE_EXTRACTOR_ARGS;
  // Multi-client strings (e.g. "web,android_vr") are passed as-is.
  return `youtube:player_client=${client};formats=missing_pot`;
}

/**
 * Normalise a YouTube URL so yt-dlp receives a canonical watch URL.
 *
 * YouTube Shorts (youtube.com/shorts/ID) are portrait videos whose height is
 * typically 1920 px — far above the `height<=1080` guard in the format
 * selector, which causes every format string to fail.  Converting to the
 * standard watch URL lets yt-dlp negotiate formats correctly and also avoids
 * a quirk where some yt-dlp versions mis-detect Shorts as unavailable.
 */
function normaliseYouTubeUrl(url: string): string {
  const m = url.match(/(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]+)/);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : url;
}

/**
 * Build the base yt-dlp argument list shared across all attempts.
 * The caller adds --extractor-args and optionally --proxy on top.
 */
function buildBaseArgs(
  url: string,
  outputPath: string,
  cookiesPath: string | null,
  proxy: string | undefined
): string[] {
  const args: string[] = [
    url,
    // Format selector — ordered from best quality to guaranteed fallback.
    //
    // When ffmpeg is available (--ffmpeg-location below) yt-dlp can merge
    // separate DASH video+audio streams, so the first two selectors produce
    // high-quality output.  When ffmpeg is unavailable or broken on the
    // current Lambda, the `+` merge selectors are skipped and yt-dlp falls
    // through to `best` (best pre-merged stream, usually 720 p mp4).
    //
    // The final `bestvideo/bestaudio` entries are absolute last resorts so
    // that yt-dlp always downloads *something*.  The resulting file may lack
    // an audio or video track; ffmpeg compositing will still run and produce
    // a partial result rather than failing the entire job with "Requested
    // format is not available".
    "-f", "bestvideo[height<=1920]+bestaudio/bestvideo+bestaudio/best/bestvideo/bestaudio",
    "--merge-output-format", "mp4",
    "--no-playlist",
    "--no-warnings",
    "-o", outputPath,
  ];
  if (cookiesPath) args.push("--cookies", cookiesPath);
  if (proxy)       args.push("--proxy", proxy);
  if (FFMPEG_PATH) args.push("--ffmpeg-location", FFMPEG_PATH);
  return args;
}

/**
 * Download a YouTube video to `outputPath` using yt-dlp.
 *
 * Retries up to three times, rotating through player clients on each attempt.
 * Permanent errors (private / removed videos) are surfaced immediately.
 *
 * Root cause of "Requested format is not available" on Vercel/AWS Lambda:
 *   YouTube blocks datacenter IPs at the network level.  Even with valid
 *   cookies the IP reputation determines whether format URLs are served.
 *   The formats=missing_pot extractor arg forces yt-dlp to expose mweb
 *   formats that would otherwise be silently dropped due to a missing
 *   Proof-of-Origin token.  For a reliable fix, set YTDLP_PROXY to a
 *   residential proxy endpoint.
 *
 * @param cookiesContent  Netscape-format cookie file content, sourced from
 *   the admin DB setting.  Falls back to YOUTUBE_COOKIES env var if omitted.
 */
/**
 * Run yt-dlp with the given args, buffering all output lines.
 * On failure, throws an Error whose message includes the full stderr/stdout
 * so Vercel logs show the real YouTube error rather than a truncated summary.
 * Cookie content is redacted from logs.
 */
function execWithFullLogs(ytDlp: YTDlpWrap, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];

    // Sanitise args for logging: redact the value after --cookies.
    const safeArgs = args.map((a, i) =>
      args[i - 1] === "--cookies" ? "<cookies-file>" :
      args[i - 1] === "--proxy"   ? "<proxy>"        : a
    );
    console.log(`[yt-dlp] exec: yt-dlp ${safeArgs.join(" ")}`);

    const proc = ytDlp.exec([...args, "--verbose"]);

    proc.on("ytDlpEvent", (_type: string, data: string) => {
      lines.push(data);
    });

    proc.on("error", (err: Error) => {
      const output = lines.join("\n");
      console.error(`[yt-dlp] FULL OUTPUT:\n${output}`);
      const combined = new Error(`${err.message}\n--- yt-dlp output ---\n${output}`);
      reject(combined);
    });

    proc.on("close", () => resolve());
  });
}

export async function downloadWithYtDlp(
  videoUrl: string,
  outputPath: string,
  cookiesContent?: string
): Promise<void> {
  const [binaryPath, cookiesPath] = await Promise.all([
    getBinary(),
    getCookiesPath(cookiesContent),
  ]);

  const normalisedUrl = normaliseYouTubeUrl(videoUrl);
  const ytDlp = new YTDlpWrap(binaryPath);
  const proxy = process.env.YTDLP_PROXY;

  // Upfront diagnostics — visible in Vercel function logs.
  console.log(
    `[yt-dlp] starting download url=${normalisedUrl} ` +
    `cookies=${cookiesPath ? `yes (${cookiesContent?.length ?? 0} chars)` : "NO"} ` +
    `proxy=${proxy ? "yes" : "NO"} ` +
    `ffmpeg=${FFMPEG_PATH ?? "NOT FOUND"}`
  );

  let lastError: Error | null = null;

  for (let i = 0; i < PLAYER_CLIENTS.length; i++) {
    const client: PlayerClient = PLAYER_CLIENTS[i];
    const clientLabel = client ?? "default(auto)";

    const args = buildBaseArgs(normalisedUrl, outputPath, cookiesPath, proxy);
    args.push("--extractor-args", buildExtractorArgs(client));

    try {
      await execWithFullLogs(ytDlp, args);
      console.log(`[yt-dlp] success on attempt ${i + 1} (client=${clientLabel})`);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isPermanentError(msg)) {
        throw new Error(`YouTube video unavailable: ${msg}`);
      }
      lastError = err instanceof Error ? err : new Error(msg);
      console.warn(`[yt-dlp] attempt ${i + 1} failed (client=${clientLabel}): ${msg.slice(0, 300)}`);
      if (i < PLAYER_CLIENTS.length - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  // If a proxy was configured and all attempts failed, try once more without
  // it.  A broken/expired YTDLP_PROXY is a common cause of failure across all
  // player clients.
  if (proxy) {
    console.warn("[yt-dlp] all proxy attempts failed — retrying without proxy");
    const args = buildBaseArgs(normalisedUrl, outputPath, cookiesPath, undefined);
    args.push("--extractor-args", BASE_EXTRACTOR_ARGS);
    try {
      await execWithFullLogs(ytDlp, args);
      console.warn("[yt-dlp] success without proxy — YTDLP_PROXY may be broken or expired");
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      lastError = err instanceof Error ? err : new Error(msg);
      console.warn(`[yt-dlp] no-proxy fallback also failed: ${msg.slice(0, 300)}`);
    }
  }

  throw lastError ?? new Error("yt-dlp: all player clients failed");
}
