import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://video-to-text.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${siteUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${siteUrl}/${l}`])
        ),
      },
    });
  }

  return entries;
}
