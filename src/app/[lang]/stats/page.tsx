import { getDb } from "@/lib/db";
import { processHistory } from "@/lib/db/schema";
import { desc, sql, count } from "drizzle-orm";
import { getDictionary, isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const [totalRow] = await getDb()
    .select({ count: count() })
    .from(processHistory);

  const [successRow] = await getDb()
    .select({ count: count() })
    .from(processHistory)
    .where(sql`${processHistory.success} = true`);

  const [failRow] = await getDb()
    .select({ count: count() })
    .from(processHistory)
    .where(sql`${processHistory.success} = false`);

  const [avgDurationRow] = await getDb()
    .select({
      avg: sql<number>`coalesce(avg(${processHistory.durationMs}), 0)::int`,
    })
    .from(processHistory)
    .where(sql`${processHistory.success} = true`);

  const recent = await getDb()
    .select({
      id: processHistory.id,
      url: processHistory.url,
      videoUrl: processHistory.videoUrl,
      frameCount: processHistory.frameCount,
      durationMs: processHistory.durationMs,
      success: processHistory.success,
      error: processHistory.error,
      createdAt: processHistory.createdAt,
    })
    .from(processHistory)
    .orderBy(desc(processHistory.createdAt))
    .limit(50);

  return {
    total: totalRow.count,
    success: successRow.count,
    failed: failRow.count,
    avgDurationMs: avgDurationRow.avg,
    recent,
  };
}

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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractVideoId(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") || u.pathname.split("/").pop() || url;
  } catch {
    return url;
  }
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const stats = await getStats();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-gradient text-3xl font-bold">
          {(dict as Record<string, string>).statsTitle || "Usage Stats"}
        </h1>
        <Link
          href={`/${locale}`}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10"
        >
          &larr; {(dict as Record<string, string>).backHome || "Back"}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-children">
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {(dict as Record<string, string>).statsTotal || "Total"}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-green-400">{stats.success}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {(dict as Record<string, string>).statsSuccess || "Success"}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-red-400">{stats.failed}</div>
          <div className="mt-1 text-sm text-zinc-400">
            {(dict as Record<string, string>).statsFailed || "Failed"}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {formatDuration(stats.avgDurationMs)}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            {(dict as Record<string, string>).statsAvgTime || "Avg Time"}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-5 text-lg font-semibold text-white">
          {(dict as Record<string, string>).statsRecent || "Recent Processing"}
        </h2>
        {stats.recent.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {(dict as Record<string, string>).statsEmpty || "No processing history yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">
                    {(dict as Record<string, string>).statsDate || "Date"}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {(dict as Record<string, string>).statsVideo || "Video"}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {(dict as Record<string, string>).statsFrames || "Frames"}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {(dict as Record<string, string>).statsDuration || "Duration"}
                  </th>
                  <th className="pb-3 pr-4 font-medium">
                    {(dict as Record<string, string>).statsStatus || "Status"}
                  </th>
                  <th className="pb-3 font-medium">
                    {(dict as Record<string, string>).statsDownload || "Download"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5 cursor-pointer"
                  >
                    <td className="py-3 pr-4 text-zinc-400 whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="py-3 pr-4 max-w-[200px] truncate">
                      <Link
                        href={`/${locale}/stats/${row.id}`}
                        className="text-blue-400 hover:text-blue-300"
                        title={row.url}
                      >
                        {extractVideoId(row.url)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-zinc-300">{row.frameCount}</td>
                    <td className="py-3 pr-4 text-zinc-300 whitespace-nowrap">
                      {formatDuration(row.durationMs)}
                    </td>
                    <td className="py-3 pr-4">
                      {row.success ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          OK
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400"
                          title={row.error || ""}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      {row.videoUrl ? (
                        <a
                          href={row.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          MP4
                        </a>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
