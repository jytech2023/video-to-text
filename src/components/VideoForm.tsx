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

const STEPS = [
  "downloading",
  "extractingAudio",
  "transcribing",
  "extractingFrames",
  "analyzingFrames",
  "done",
] as const;

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
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setResult(null);
      setProcessing(true);
      setCurrentStep("downloading");
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
                setCurrentStep(data.step);
                setProgress(dict.progress[step] ?? data.step);
              } else if (eventType === "result") {
                setResult(data as ProcessingResult);
              } else if (eventType === "error") {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              if (eventType === "error") throw parseErr;
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
        setCurrentStep("");
      }
    },
    [url, frameCount, lang, dict]
  );

  const stepIndex = STEPS.indexOf(currentStep as (typeof STEPS)[number]);
  const progressPercent = processing
    ? Math.max(5, ((stepIndex + 1) / STEPS.length) * 100)
    : 0;

  return (
    <div className="w-full space-y-8">
      {/* Form Card */}
      <div className="glass rounded-2xl p-6 sm:p-8 animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="url"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              {dict.form.urlLabel}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.193-9.193a4.5 4.5 0 016.364 6.364l-4.5 4.5a4.5 4.5 0 01-7.244-1.242" />
                </svg>
              </div>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={dict.form.urlPlaceholder}
                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white shadow-sm transition-all placeholder:text-zinc-500 focus:border-blue-500/50 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={processing}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="frameCount"
                className="text-sm font-medium text-zinc-300"
              >
                {dict.form.framesLabel}
              </label>
              <span className="rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-sm font-bold tabular-nums text-white">
                {frameCount}
              </span>
            </div>
            <input
              id="frameCount"
              type="range"
              min={1}
              max={30}
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              className="w-full"
              disabled={processing}
            />
            <div className="mt-1 flex justify-between text-xs text-zinc-600">
              <span>1</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing || !url}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {dict.form.processing}
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                  </svg>
                  {dict.form.submit}
                </>
              )}
            </span>
          </button>
        </form>
      </div>

      {/* Progress */}
      {processing && progress && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              {progress}
            </span>
            <span className="text-xs tabular-nums text-zinc-500">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-4 flex gap-1.5">
            {STEPS.slice(0, -1).map((step, i) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= stepIndex
                    ? "bg-gradient-to-r from-blue-500 to-purple-500"
                    : "bg-white/5"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="animate-fade-in-up rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && <ResultDisplay result={result} dict={dict} />}
    </div>
  );
}
