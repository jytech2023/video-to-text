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
    <div className="relative flex min-h-screen flex-col bg-grid">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-pink-600/8 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg shadow-lg shadow-blue-500/20">
              V
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Video<span className="text-gradient">2Text</span>
            </span>
          </div>
          <LanguageSwitcher current={locale} />
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-zinc-500">
        Powered by Groq & Gemini AI
      </footer>
    </div>
  );
}
