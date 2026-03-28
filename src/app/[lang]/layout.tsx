import type { Metadata } from "next";
import { getDictionary, isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  const dict = (await getDictionary(locale)) as Record<string, string>;
  return {
    title: dict.title,
    description: dict.description,
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : defaultLocale;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            🎬 Video to Text
          </h1>
          <LanguageSwitcher current={locale} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
