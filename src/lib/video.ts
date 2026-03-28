import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import os from "os";

const exec = promisify(execFile);

export async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "v2t-"));
  return dir;
}

export async function downloadVideo(
  url: string,
  outputDir: string
): Promise<string> {
  const outputPath = path.join(outputDir, "video.mp4");
  await exec(
    "yt-dlp",
    [
      "-f",
      "bv*+ba/b",
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "-o",
      outputPath,
      url,
    ],
    { timeout: 300_000, maxBuffer: 10 * 1024 * 1024 }
  );
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
