import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { isLocale, type Locale, LOCALE_COOKIE, localeFromAcceptLanguage } from "./config";
import { messages } from "./messages";

/** The visitor's UI language: their saved choice, else what their browser asks for. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

/** The UI text for this request's language. */
export const getMessages = async () => messages[await getLocale()];
