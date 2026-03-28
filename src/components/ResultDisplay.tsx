"use client";

import { useCallback } from "react";

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

export default function ResultDisplay({
  result,
  dict,
}: {
  result: ProcessingResult;
  dict: Dict;
}) {
  const handleDownload = useCallback(() => {
    const content = {
      transcription: result.transcription,
      frames: result.frames.map((f) => ({
        index: f.index,
        description: f.description,
      })),
    };
    const blob = new Blob([JSON.stringify(content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video-to-text-results.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {dict.results.title}
        </h2>
        <button
          onClick={handleDownload}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {dict.results.download}
        </button>
      </div>

      {/* Transcription */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          {dict.results.transcription}
        </h3>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {result.transcription || dict.results.noTranscription}
        </div>
      </section>

      {/* Frame Analysis */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {dict.results.frames}
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {result.frames.map((frame) => (
            <div
              key={frame.index}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.image}
                  alt={`${dict.results.frame} ${frame.index}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
                  {dict.results.frame} {frame.index}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {frame.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
