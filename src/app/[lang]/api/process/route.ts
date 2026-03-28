import { NextRequest } from "next/server";
import {
  downloadVideo,
  extractAudio,
  extractFrames,
  createTempDir,
  cleanup,
} from "@/lib/video";
import { transcribeAudio, analyzeFrames } from "@/lib/ai";
import { isR2Configured, uploadToR2 } from "@/lib/r2";
import { getDb } from "@/lib/db";
import { processHistory } from "@/lib/db/schema";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { url, frameCount = 10 } = body as {
    url: string;
    frameCount?: number;
  };

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  const clampedFrameCount = Math.max(1, Math.min(frameCount, 30));
  let tempDir: string | null = null;

  try {
    // Use SSE for progress updates
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        const startTime = Date.now();

        try {
          // 1. Download video
          send("progress", { step: "downloading" });
          tempDir = await createTempDir();
          const videoPath = await downloadVideo(url, tempDir);

          // 2. Upload video to R2 (only if configured)
          let videoUrl: string | undefined;
          if (isR2Configured()) {
            send("progress", { step: "uploading" });
            try {
              videoUrl = await uploadToR2(videoPath);
            } catch (uploadErr) {
              console.error("R2 upload failed:", uploadErr);
            }
          } else {
            console.warn("R2 not configured, skipping video upload. Missing env vars.");
          }

          // 3. Extract audio and transcribe
          send("progress", { step: "extractingAudio" });
          const audioPath = await extractAudio(videoPath);

          send("progress", { step: "transcribing" });
          const transcription = await transcribeAudio(audioPath);

          // 4. Extract and analyze frames
          send("progress", { step: "extractingFrames" });
          const framePaths = await extractFrames(videoPath, clampedFrameCount);

          send("progress", { step: "analyzingFrames" });
          const frameResults = await analyzeFrames(framePaths);

          // 5. Save to database
          const frames = frameResults.map((f) => ({
            index: f.index,
            description: f.description,
            image: `data:image/jpeg;base64,${f.base64}`,
          }));

          try {
            await getDb().insert(processHistory).values({
              url,
              transcription,
              videoUrl,
              frameCount: clampedFrameCount,
              frames: JSON.stringify(
                frameResults.map((f) => ({
                  index: f.index,
                  description: f.description,
                }))
              ),
              durationMs: Date.now() - startTime,
              success: true,
            });
          } catch {
            // DB save failed, continue — results are still returned
          }

          // 6. Send final result
          send("result", { transcription, videoUrl, frames });

          send("progress", { step: "done" });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error occurred";

          // Save failed attempt to database
          try {
            await getDb().insert(processHistory).values({
              url,
              frameCount: clampedFrameCount,
              durationMs: Date.now() - startTime,
              success: false,
              error: message,
            });
          } catch {
            // DB save failed, ignore
          }

          send("error", { message });
        } finally {
          if (tempDir) await cleanup(tempDir);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (tempDir) await cleanup(tempDir);
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    return Response.json({ error: message }, { status: 500 });
  }
}
