import { join } from "path";
import { tmpdir } from "os";
import { access, chmod, writeFile } from "fs/promises";
import YTDlpWrap from "yt-dlp-wrap";

// Binary is cached in /tmp between warm Lambda invocations.
const BINARY_PATH = join(tmpdir(), "yt-dlp");

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

async function ensureBinary(): Promise<string> {
  try {
    await access(BINARY_PATH);
    return BINARY_PATH;
  } catch {
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
}

function getBinary(): Promise<string> {
  if (!_binaryReady) {
    _binaryReady = ensureBinary().catch((err) => {
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
  if (cookies !== _cookiesContent) {
    await writeFile(COOKIES_PATH, cookies, "utf8");
    _cookiesContent = cookies;
  }
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
  ].some((s) => message.toLowerCase().includes(s.toLowerCase()));
}

// Player clients tried in order.  tv_embedded is least bot-guarded; android
// and web are fallbacks for videos that reject the embedded client.
const PLAYER_CLIENTS = ["tv_embedded,web", "android", "web"] as const;
const RETRY_DELAY_MS = 2_000;

/**
 * Download a YouTube video to `outputPath` using yt-dlp.
 *
 * Retries up to three times, rotating through player clients on each attempt.
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

  const ytDlp = new YTDlpWrap(binaryPath);
  const proxy = process.env.YTDLP_PROXY;

  let lastError: Error | null = null;

  for (let i = 0; i < PLAYER_CLIENTS.length; i++) {
    const client = PLAYER_CLIENTS[i];
    const args: string[] = [
      videoUrl,
      "--extractor-args", `youtube:player_client=${client}`,
      "-f", "bestvideo[height<=1080]+bestaudio/bestvideo+bestaudio/best",
      "--merge-output-format", "mp4",
      "--no-playlist",
      "--no-warnings",
      "-o", outputPath,
    ];
    if (cookiesPath) args.push("--cookies", cookiesPath);
    if (proxy)       args.push("--proxy", proxy);

    try {
      await ytDlp.execPromise(args);
      return; // success — stop retrying
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isPermanentError(msg)) {
        throw new Error(`YouTube video unavailable: ${msg}`);
      }
      lastError = err instanceof Error ? err : new Error(msg);
      console.warn(`[yt-dlp] attempt ${i + 1} failed (client=${client}): ${msg}`);
      if (i < PLAYER_CLIENTS.length - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  throw lastError ?? new Error("yt-dlp: all player clients failed");
}
