/** UI languages. Thai first; more can be added by adding a dictionary that matches the English one. */
export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";
export const LOCALE_COOKIE = "lang";
export const LOCALE_NAMES: Record<Locale, string> = { th: "ไทย", en: "English" };

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/** The best UI language from an Accept-Language header: Thai if the browser lists it anywhere, else English, else the default. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const langs = header.toLowerCase().split(",").map((p) => p.trim().split(";")[0]);
  if (langs.some((l) => l === "th" || l.startsWith("th-"))) return "th";
  if (langs.some((l) => l === "en" || l.startsWith("en-"))) return "en";
  return DEFAULT_LOCALE;
}
