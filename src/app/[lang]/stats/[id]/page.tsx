import { db } from "@/lib/db";
import { processHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getDictionary, isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function StatsDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : defaultLocale;
  const dict = (await getDictionary(locale)) as Record<string, string>;

  const [record] = await db
    .select()
    .from(processHistory)
    .where(eq(processHistory.id, id))
    .limit(1);

  if (!record) notFound();

  const frames: { index: number; description: string }[] = record.frames
    ? JSON.parse(record.frames)
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-gradient text-3xl font-bold">
          {dict.statsDetailTitle || "Processing Detail"}
        </h1>
        <Link
          href={`/${locale}/stats`}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10"
        >
          &larr; {dict.statsBackToList || "Back to Stats"}
        </Link>
      </div>

      {/* Meta Info */}
      <div className="glass rounded-2xl p-6 mb-8">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <dt className="text-zinc-500">{dict.statsDate || "Date"}</dt>
            <dd className="mt-1 text-white">{formatDate(record.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{dict.statsStatus || "Status"}</dt>
            <dd className="mt-1">
              {record.success ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  OK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Error
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">{dict.statsDuration || "Duration"}</dt>
            <dd className="mt-1 text-white">{formatDuration(record.durationMs)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">{dict.statsFrames || "Frames"}</dt>
            <dd className="mt-1 text-white">{record.frameCount}</dd>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-zinc-500">{dict.statsVideo || "Video"}</dt>
            <dd className="mt-1">
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all"
              >
                {record.url}
              </a>
            </dd>
          </div>
          {record.videoUrl && (
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-zinc-500">{dict.statsDownload || "Download"}</dt>
              <dd className="mt-1">
                <a
                  href={record.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  {dict.downloadVideo || "Download Video"}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Error */}
      {record.error && (
        <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {record.error}
          </div>
        </div>
      )}

      {/* Transcription */}
      {record.transcription && (
        <section className="glass glow-blue rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            {dict.transcription || "Speech Transcription"}
          </h2>
          <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
            {record.transcription}
          </div>
        </section>
      )}

      {/* Frame Analysis */}
      {frames.length > 0 && (
        <section>
          <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {dict.statsFrameAnalysis || "Frame Analysis"} ({frames.length})
          </h2>
          <div className="space-y-4 stagger-children">
            {frames.map((frame) => (
              <div
                key={frame.index}
                className="glass rounded-2xl p-5"
              >
                <div className="mb-2 text-xs font-semibold text-purple-400">
                  {dict.frame || "Frame"} {frame.index}
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">
                  {frame.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
