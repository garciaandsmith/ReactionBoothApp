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
const BINARY_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  // If we have a cached ready-promise, verify the binary on disk is still
  // fresh enough.  If stale, delete it so downloadBinary() fetches the latest.
  if (_binaryReady) {
    try {
      const s = await stat(BINARY_PATH);
      if (Date.now() - s.mtimeMs > BINARY_MAX_AGE_MS) {
        console.log("[yt-dlp] cached binary is >24 h old — fetching latest release");
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

// Player clients tried in order.
//
// null (first) = omit --extractor-args entirely so yt-dlp uses its own
// built-in client selection.  Modern yt-dlp (2024 +) auto-negotiates PO
// (Proof-of-Origin) tokens through this path; explicitly naming a client
// bypasses that logic and causes "Requested format is not available" on any
// video where YouTube requires a valid PO token.
//
// The remaining entries are fallbacks in case the default selection fails for
// a particular video.  "mweb" (mobile-web) was added in yt-dlp 2024 and is
// often the most reliable named client.  "web" is intentionally absent: it
// requires a PO token that yt-dlp cannot obtain in a server environment, so
// it always fails when used explicitly.
const PLAYER_CLIENTS = [null, "ios", "android", "mweb", "tv_embedded,web"] as const;
type PlayerClient = (typeof PLAYER_CLIENTS)[number];
const RETRY_DELAY_MS = 2_000;

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
 * Download a YouTube video to `outputPath` using yt-dlp.
 *
 * Retries up to four times, rotating through player clients on each attempt.
 * Permanent errors (private / removed videos) are surfaced immediately.
 *
 * @param cookiesContent  Netscape-format cookie file content, sourced from
 *   the admin DB setting.  Falls back to YOUTUBE_COOKIES env var if omitted.
 */
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

  // Proxy variants to try, in order.
  //
  // A blocked or misbehaving proxy makes YouTube return an empty format list
  // rather than an explicit network error, so yt-dlp reports "Requested format
  // is not available" even when the format string is perfectly valid.  By
  // trying a direct connection first we bypass that problem entirely when the
  // Lambda can reach YouTube without the proxy.  The proxy is kept as a second
  // pass in case Vercel's outbound IPs are also blocked.
  //
  // A third pass without cookies guards against the edge case where expired or
  // suspicious cookies cause YouTube to serve a restricted (empty) format list
  // to an otherwise valid request.
  type ProxyCookieVariant = { proxyValue: string | null; useCookies: boolean };
  const variants: ProxyCookieVariant[] = [
    { proxyValue: null,  useCookies: true  }, // 1. direct + cookies   (most likely to work)
    ...(proxy ? [{ proxyValue: proxy, useCookies: true  }] : []), // 2. proxy + cookies
    { proxyValue: null,  useCookies: false }, // 3. direct, no cookies  (stale cookie fallback)
    ...(proxy ? [{ proxyValue: proxy, useCookies: false }] : []), // 4. proxy, no cookies
  ];

  let attemptNum = 0;
  let lastError: Error | null = null;
  const totalAttempts = variants.length * PLAYER_CLIENTS.length;

  for (const { proxyValue, useCookies } of variants) {
    for (let i = 0; i < PLAYER_CLIENTS.length; i++) {
      attemptNum++;
      const client: PlayerClient = PLAYER_CLIENTS[i];
      const args: string[] = [normalisedUrl];

      // null = use yt-dlp's default client (handles PO tokens automatically).
      if (client !== null) {
        args.push("--extractor-args", `youtube:player_client=${client}`);
      }

      args.push(
        // Format selector — best DASH merge → best combined → video-only/audio-only.
        // The final bestvideo/bestaudio entries guarantee yt-dlp always finds
        // *something* when ffmpeg is unavailable and no combined stream exists.
        "-f", "bestvideo[height<=1920]+bestaudio/bestvideo+bestaudio/best/bestvideo/bestaudio",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--no-warnings",
        "-o", outputPath,
      );
      if (useCookies && cookiesPath) args.push("--cookies", cookiesPath);
      if (proxyValue)                args.push("--proxy", proxyValue);
      if (FFMPEG_PATH)               args.push("--ffmpeg-location", FFMPEG_PATH);

      const clientLabel  = client ?? "default";
      const proxyLabel   = proxyValue ? "proxy" : "direct";
      const cookieLabel  = useCookies ? "cookies" : "no-cookies";
      try {
        await ytDlp.execPromise(args);
        return; // success
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (isPermanentError(msg)) {
          throw new Error(`YouTube video unavailable: ${msg}`);
        }
        lastError = err instanceof Error ? err : new Error(msg);
        console.warn(
          `[yt-dlp] attempt ${attemptNum}/${totalAttempts} failed` +
          ` (client=${clientLabel}, ${proxyLabel}, ${cookieLabel}): ${msg}`
        );
        if (attemptNum < totalAttempts) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
  }

  throw lastError ?? new Error("yt-dlp: all attempts failed");
}
