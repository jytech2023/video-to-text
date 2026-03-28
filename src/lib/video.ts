import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import os from "os";

const exec = promisify(execFile);

const COOKIES_TMP_PATH = path.join(os.tmpdir(), "v2t-cookies.txt");

async function resolveCookies(): Promise<string | null> {
  // 1. Base64 env var (Render/Docker)
  const base64 = process.env.YT_COOKIES_BASE64;
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    await fs.writeFile(COOKIES_TMP_PATH, decoded);
    return COOKIES_TMP_PATH;
  }

  // 2. Base64 file (committed to repo for remote deployments)
  const base64FilePath = process.env.YT_COOKIE_BASE64_FILE;
  if (base64FilePath) {
    try {
      const base64Content = (await fs.readFile(base64FilePath, "utf-8")).trim();
      const decoded = Buffer.from(base64Content, "base64").toString("utf-8");
      await fs.writeFile(COOKIES_TMP_PATH, decoded);
      return COOKIES_TMP_PATH;
    } catch {
      // file doesn't exist or unreadable, fall through
    }
  }

  // 3. Direct file path
  const filePath = process.env.YT_COOKIE_FILE;
  if (filePath) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // file doesn't exist, fall through
    }
  }

  return null;
}

export async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "v2t-"));
  return dir;
}

export async function downloadVideo(
  url: string,
  outputDir: string
): Promise<string> {
  const outputPath = path.join(outputDir, "video.mp4");
  const args = [
    "-f",
    "bv*+ba/b",
    "--merge-output-format",
    "mp4",
    "--no-playlist",
    "--js-runtimes",
    "deno",
    "--remote-components",
    "ejs:github",
    "-o",
    outputPath,
  ];

  // Resolve cookies: base64 env → file → browser (in priority order)
  const cookieFile = await resolveCookies();
  const cookieBrowser = process.env.YT_COOKIE_BROWSER;
  if (cookieFile) {
    args.push("--cookies", cookieFile);
  } else if (cookieBrowser) {
    args.push("--cookies-from-browser", cookieBrowser);
  }

  args.push(url);

  await exec("yt-dlp", args, { timeout: 300_000, maxBuffer: 10 * 1024 * 1024 });
  return outputPath;
}

export async function extractAudio(videoPath: string): Promise<string> {
  const dir = path.dirname(videoPath);
  const audioPath = path.join(dir, "audio.mp3");
  await exec(
    "ffmpeg",
    ["-i", videoPath, "-vn", "-acodec", "libmp3lame", "-q:a", "4", "-y", audioPath],
    { timeout: 120_000 }
  );
  return audioPath;
}

export async function extractFrames(
  videoPath: string,
  count: number = 10
): Promise<string[]> {
  const dir = path.dirname(videoPath);
  const framesDir = path.join(dir, "frames");
  await fs.mkdir(framesDir, { recursive: true });

  // Get video duration
  const { stdout } = await exec("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    videoPath,
  ]);
  const duration = parseFloat(stdout.trim());
  if (isNaN(duration) || duration <= 0) {
    throw new Error("Could not determine video duration");
  }

  const framePaths: string[] = [];
  const interval = duration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const timestamp = (interval * i).toFixed(2);
    const framePath = path.join(framesDir, `frame_${String(i).padStart(3, "0")}.jpg`);
    await exec("ffmpeg", [
      "-ss",
      timestamp,
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-y",
      framePath,
    ]);
    framePaths.push(framePath);
  }

  return framePaths;
}

export async function cleanup(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}
