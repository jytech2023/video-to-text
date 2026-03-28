import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";
import VideoForm from "@/components/VideoForm";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://video-to-text.vercel.app";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? lang : defaultLocale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = (await getDictionary(locale)) as Record<string, any>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Video2Text",
    description: dict.description,
    url: `${siteUrl}/${locale}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "YouTube video transcription",
      "Speech to text",
      "Video frame analysis",
      "Multi-language support",
    ],
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-10 text-center sm:mb-16 animate-fade-in-up">
        <h2 className="text-gradient text-4xl font-extrabold tracking-tight sm:text-5xl">
          {dict.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400 sm:text-lg">
          {dict.description}
        </p>
      </div>
      <VideoForm dict={dict} lang={locale} />
    </div>
  );
}
