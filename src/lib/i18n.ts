export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

const dictionaries: Record<Locale, () => Promise<Record<string, unknown>>> = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  zh: () => import("./dictionaries/zh.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  const loadDict = dictionaries[locale] ?? dictionaries[defaultLocale];
  return loadDict();
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
