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
    <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={getLocalePath(locale)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            locale === current
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {labels[locale]}
        </Link>
      ))}
    </div>
  );
}
