import { join } from "path";
import { tmpdir } from "os";
import { access, chmod, writeFile } from "fs/promises";
import YTDlpWrap from "yt-dlp-wrap";

// Binary is cached in /tmp between warm Lambda invocations.
// On cold starts it is downloaded once from the yt-dlp GitHub release (~12 MB).
const BINARY_PATH = join(tmpdir(), "yt-dlp");

// If YOUTUBE_COOKIES is set, its Netscape-format content is written here once
// and reused across requests.
const COOKIES_PATH = join(tmpdir(), "yt-dlp-cookies.txt");

// Module-level singleton so concurrent requests share one download promise.
let _binaryReady: Promise<string> | null = null;
let _cookiesWritten = false;

// Map Node arch strings to the yt-dlp standalone binary filenames.
// The standalone binaries bundle Python via PyInstaller and need no system Python.
// The default `downloadFromGithub` on Linux fetches the Python zipapp which
// requires `python3` in PATH — use the explicit standalone URL instead.
const STANDALONE_URLS: Partial<Record<NodeJS.Architecture, string>> = {
  x64: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux",
  arm64:
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64",
};

async function ensureBinary(): Promise<string> {
  try {
    await access(BINARY_PATH);
    return BINARY_PATH;
  } catch {
    // Not cached yet — download the appropriate binary.
    const standaloneUrl =
      process.platform === "linux" ? STANDALONE_URLS[process.arch] : undefined;

    if (standaloneUrl) {
      await YTDlpWrap.downloadFile(standaloneUrl, BINARY_PATH);
    } else {
      // macOS, Windows, or unknown Linux arch — let the library decide.
      await YTDlpWrap.downloadFromGithub(BINARY_PATH);
    }

    await chmod(BINARY_PATH, 0o755);
    return BINARY_PATH;
  }
}

function getBinary(): Promise<string> {
  if (!_binaryReady) {
    _binaryReady = ensureBinary().catch((err) => {
      _binaryReady = null; // allow retry on next call
      throw err;
    });
  }
  return _binaryReady;
}

/**
 * Write the YOUTUBE_COOKIES env variable to a Netscape-format cookies file in
 * /tmp so yt-dlp can authenticate with YouTube. The file is written once per
 * process lifetime and reused for subsequent requests.
 *
 * Returns the cookies file path, or null if the env variable is not set.
 */
async function getCookiesPath(): Promise<string | null> {
  const cookies = process.env.YOUTUBE_COOKIES;
  if (!cookies) return null;

  if (!_cookiesWritten) {
    await writeFile(COOKIES_PATH, cookies, "utf8");
    _cookiesWritten = true;
  }

  return COOKIES_PATH;
}

/**
 * Download a YouTube video to `outputPath` using yt-dlp.
 *
 * Uses the tv_embedded player client, which is less restricted than the
 * standard web client and does not require a PO token for most videos.
 *
 * If the YOUTUBE_COOKIES environment variable is set (Netscape cookie file
 * format, exported from a logged-in browser session), it is passed via
 * --cookies to authenticate requests that YouTube bot-guards.
 */
export async function downloadWithYtDlp(
  videoUrl: string,
  outputPath: string
): Promise<void> {
  const [binaryPath, cookiesPath] = await Promise.all([
    getBinary(),
    getCookiesPath(),
  ]);

  const ytDlp = new YTDlpWrap(binaryPath);

  const args: string[] = [
    videoUrl,
    // tv_embedded client: embedded-player API, less bot-guarded than web
    "--extractor-args",
    "youtube:player_client=tv_embedded,web",
    // Prefer an mp4 that already merges video+audio; fall back to best available
    "-f",
    "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    "--merge-output-format",
    "mp4",
    "--no-playlist",
    "--no-warnings",
    "-o",
    outputPath,
  ];

  if (cookiesPath) {
    args.push("--cookies", cookiesPath);
  }

  await ytDlp.execPromise(args);
}
