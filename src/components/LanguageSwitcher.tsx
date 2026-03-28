"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
};

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();

  function getLocalePath(locale: Locale) {
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/");
  }

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 p-1">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={getLocalePath(locale)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            locale === current
              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {labels[locale]}
        </Link>
      ))}
    </div>
  );
}
