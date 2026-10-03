"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { messages } from "./messages";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Hands the request's language to client components (the dictionaries themselves are bundled, not serialised). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export const useMessages = () => messages[useLocale()];
