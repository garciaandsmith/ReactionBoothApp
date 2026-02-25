import { join } from "path";
import { tmpdir } from "os";
import { access, chmod } from "fs/promises";
import YTDlpWrap from "yt-dlp-wrap";

// Binary is cached in /tmp between warm Lambda invocations.
// On cold starts it is downloaded once from the yt-dlp GitHub release (~12 MB).
const BINARY_PATH = join(tmpdir(), "yt-dlp");

// Module-level singleton so concurrent requests share one download promise.
let _binaryReady: Promise<string> | null = null;

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
 * Download a YouTube video to `outputPath` using yt-dlp.
 *
 * Uses the iOS player client so no PO token or authenticated account is
 * required — YouTube's iOS API does not require Proof-of-Origin tokens.
 * Falls back to the web client automatically if iOS is unavailable.
 */
export async function downloadWithYtDlp(
  videoUrl: string,
  outputPath: string
): Promise<void> {
  const binaryPath = await getBinary();
  const ytDlp = new YTDlpWrap(binaryPath);

  await ytDlp.execPromise([
    videoUrl,
    // iOS player client: no PO token required, widely available formats
    "--extractor-args",
    "youtube:player_client=ios,web",
    // Prefer an mp4 that already merges video+audio; fall back to best available
    "-f",
    "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    "--merge-output-format",
    "mp4",
    "--no-playlist",
    "--no-warnings",
    "-o",
    outputPath,
  ]);
}
