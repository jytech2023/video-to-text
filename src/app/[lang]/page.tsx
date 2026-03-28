import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";
import VideoForm from "@/components/VideoForm";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = (await getDictionary(locale)) as Record<string, any>;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 text-center sm:mb-12">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
          {dict.title}
        </h2>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          {dict.description}
        </p>
      </div>
      <VideoForm dict={dict} lang={locale} />
    </div>
  );
}
