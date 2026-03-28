import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fs from "fs/promises";

const RATE_LIMIT_DELAY = 4_000;
const MAX_RETRIES = 3;

type Provider = "gemini" | "groq";

function getProvider(): Provider {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error("No AI API key configured. Set GROQ_API_KEY or GEMINI_API_KEY.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const is429 = message.includes("429") || message.includes("quota") || message.includes("rate");
      if (is429 && attempt < MAX_RETRIES - 1) {
        const backoff = Math.min(20_000 * (attempt + 1), 60_000);
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

// ─── Gemini ───────────────────────────────────────────────

function getGeminiClient() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

async function geminiTranscribe(audioPath: string): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({ model: "gemini-2.0-flash" });
  const audioBuffer = await fs.readFile(audioPath);

  const result = await callWithRetry(() =>
    model.generateContent([
      { inlineData: { mimeType: "audio/mpeg", data: audioBuffer.toString("base64") } },
      { text: "Transcribe the speech in this audio accurately. Output ONLY the transcription text, nothing else. If there is no speech, output 'No speech detected'. Preserve the original language." },
    ])
  );
  return result.response.text();
}

async function geminiAnalyzeFrame(framePath: string): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({ model: "gemini-2.0-flash" });
  const imageBuffer = await fs.readFile(framePath);

  const result = await callWithRetry(() =>
    model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: imageBuffer.toString("base64") } },
      { text: "Describe what you see in this video frame in detail. Include any visible text, objects, people, actions, and scene context. Respond in the same language as any visible text, or in English if no text is visible." },
    ])
  );
  return result.response.text();
}

// ─── Groq ─────────────────────────────────────────────────

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function groqTranscribe(audioPath: string): Promise<string> {
  const groq = getGroqClient();
  const audioBuffer = await fs.readFile(audioPath);
  const file = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

  const result = await callWithRetry(() =>
    groq.audio.transcriptions.create({
      model: "whisper-large-v3-turbo",
      file,
      response_format: "text",
    })
  );
  return result as unknown as string;
}

async function groqAnalyzeFrame(framePath: string): Promise<string> {
  const groq = getGroqClient();
  const imageBuffer = await fs.readFile(framePath);
  const base64 = imageBuffer.toString("base64");

  const result = await callWithRetry(() =>
    groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
            {
              type: "text",
              text: "Describe what you see in this video frame in detail. Include any visible text, objects, people, actions, and scene context. Respond in the same language as any visible text, or in English if no text is visible.",
            },
          ],
        },
      ],
      max_tokens: 500,
    })
  );
  return result.choices[0]?.message?.content ?? "";
}

// ─── Format ───────────────────────────────────────────────

async function formatTranscription(raw: string): Promise<string> {
  if (!raw || raw.trim().length === 0) return raw;

  const provider = getProvider();

  if (provider === "groq") {
    const groq = getGroqClient();
    const result = await callWithRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a text formatter. Your ONLY job is to format the raw speech transcription below into readable paragraphs. Rules:\n" +
              "- Add proper punctuation (periods, commas, question marks)\n" +
              "- Break into logical paragraphs by topic\n" +
              "- Do NOT change, summarize, or rephrase any words\n" +
              "- Do NOT add any commentary, titles, or headers\n" +
              "- Preserve the original language exactly",
          },
          { role: "user", content: raw },
        ],
        max_tokens: 4096,
      })
    );
    return result.choices[0]?.message?.content ?? raw;
  }

  // Gemini
  const model = getGeminiClient().getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await callWithRetry(() =>
    model.generateContent([
      {
        text:
          "Format the following raw speech transcription into readable paragraphs. Rules:\n" +
          "- Add proper punctuation (periods, commas, question marks)\n" +
          "- Break into logical paragraphs by topic\n" +
          "- Do NOT change, summarize, or rephrase any words\n" +
          "- Do NOT add any commentary, titles, or headers\n" +
          "- Preserve the original language exactly\n\n" +
          raw,
      },
    ])
  );
  return result.response.text();
}

// ─── Public API ───────────────────────────────────────────

export async function transcribeAudio(audioPath: string): Promise<string> {
  const provider = getProvider();
  const raw =
    provider === "groq"
      ? await groqTranscribe(audioPath)
      : await geminiTranscribe(audioPath);
  return formatTranscription(raw);
}

async function analyzeFrame(framePath: string): Promise<string> {
  const provider = getProvider();
  if (provider === "groq") return groqAnalyzeFrame(framePath);
  return geminiAnalyzeFrame(framePath);
}

export async function analyzeFrames(
  framePaths: string[]
): Promise<{ index: number; description: string; base64: string }[]> {
  const results: { index: number; description: string; base64: string }[] = [];

  for (let i = 0; i < framePaths.length; i++) {
    if (i > 0) await sleep(RATE_LIMIT_DELAY);

    const fp = framePaths[i];
    const description = await analyzeFrame(fp);
    const imageBuffer = await fs.readFile(fp);
    results.push({
      index: i + 1,
      description,
      base64: imageBuffer.toString("base64"),
    });
  }

  return results;
}
