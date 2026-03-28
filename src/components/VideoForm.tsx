"use client";

import { useState, useCallback } from "react";
import ResultDisplay from "./ResultDisplay";

interface FrameResult {
  index: number;
  description: string;
  image: string;
}

interface ProcessingResult {
  transcription: string;
  frames: FrameResult[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>;

export default function VideoForm({
  dict,
  lang,
}: {
  dict: Dict;
  lang: string;
}) {
  const [url, setUrl] = useState("");
  const [frameCount, setFrameCount] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setResult(null);
      setProcessing(true);
      setProgress(dict.progress.downloading);

      try {
        const response = await fetch(`/${lang}/api/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, frameCount }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || dict.errors.processingFailed);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let eventType = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE messages are separated by double newlines
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? "";

          for (const message of messages) {
            const lines = message.split("\n");
            let dataStr = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr += line.slice(6);
              }
            }
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (eventType === "progress") {
                const step = data.step as keyof typeof dict.progress;
                setProgress(dict.progress[step] ?? data.step);
              } else if (eventType === "result") {
                setResult(data as ProcessingResult);
              } else if (eventType === "error") {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              if (eventType === "error") throw parseErr;
              // skip unparseable chunks
            }
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : dict.errors.processingFailed
        );
      } finally {
        setProcessing(false);
        setProgress("");
      }
    },
    [url, frameCount, lang, dict]
  );

  return (
    <div className="w-full space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {dict.form.urlLabel}
          </label>
          <input
            id="url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={dict.form.urlPlaceholder}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            disabled={processing}
          />
        </div>

        <div>
          <label
            htmlFor="frameCount"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {dict.form.framesLabel}
          </label>
          <div className="mt-1 flex items-center gap-4">
            <input
              id="frameCount"
              type="range"
              min={1}
              max={30}
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              className="flex-1"
              disabled={processing}
            />
            <span className="w-10 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {frameCount}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing || !url}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {processing ? dict.form.processing : dict.form.submit}
        </button>
      </form>

      {processing && progress && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/30">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {progress}
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {result && <ResultDisplay result={result} dict={dict} />}
    </div>
  );
}
