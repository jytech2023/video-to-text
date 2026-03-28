"use client";

import { useCallback } from "react";

interface FrameResult {
  index: number;
  description: string;
  image: string;
}

interface ProcessingResult {
  transcription: string;
  videoUrl?: string;
  frames: FrameResult[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>;

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v");
    } else if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

export default function ResultDisplay({
  result,
  dict,
  sourceUrl,
}: {
  result: ProcessingResult;
  dict: Dict;
  sourceUrl?: string;
}) {
  const handleDownload = useCallback(() => {
    const content = {
      sourceUrl,
      videoUrl: result.videoUrl,
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
  }, [result, sourceUrl]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-gradient text-2xl font-bold">
          {dict.results.title}
        </h2>
        <div className="flex items-center gap-2">
          {result.videoUrl && (
            <a
              href={result.videoUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-purple-500/30 hover:bg-purple-500/10"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              {dict.results.downloadVideo}
            </a>
          )}
          <button
            onClick={handleDownload}
            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            {dict.results.download}
          </button>
        </div>
      </div>

      {/* Video */}
      {(sourceUrl || result.videoUrl) && (() => {
        const embedUrl = sourceUrl ? getYouTubeEmbedUrl(sourceUrl) : null;
        return (
          <section className="glass glow-purple rounded-2xl p-6 sm:p-8">
            <h3 className="mb-5 flex items-center gap-3 text-lg font-semibold text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              {dict.results.videoPlayback || "Video"}
            </h3>
            {embedUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : result.videoUrl ? (
              <video
                src={result.videoUrl}
                controls
                className="w-full rounded-xl"
                preload="metadata"
              />
            ) : null}
          </section>
        );
      })()}

      {/* Transcription */}
      <section className="glass glow-blue rounded-2xl p-6 sm:p-8">
        <h3 className="mb-5 flex items-center gap-3 text-lg font-semibold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
            <svg
              className="h-4 w-4 text-blue-400"
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
          </div>
          {dict.results.transcription}
        </h3>
        <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
          {result.transcription || dict.results.noTranscription}
        </div>
      </section>

      {/* Frame Analysis */}
      <section>
        <h3 className="mb-6 flex items-center gap-3 text-lg font-semibold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <svg
              className="h-4 w-4 text-purple-400"
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
          </div>
          {dict.results.frames}
        </h3>
        <div className="grid gap-5 sm:grid-cols-2 stagger-children">
          {result.frames.map((frame) => (
            <div
              key={frame.index}
              className="group glass glass-hover overflow-hidden rounded-2xl transition-all duration-300 hover:glow-purple"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.image}
                  alt={`${dict.results.frame} ${frame.index}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  {dict.results.frame} {frame.index}
                </span>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors">
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
