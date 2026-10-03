"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES } from "@/lib/i18n/config";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Saves the UI language for a year. Kept outside the component: it writes to the document. */
function saveLocale(l: string) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** TH | EN toggle. Saves the choice for a year and re-renders the page in the new language. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale();
  const m = useMessages();
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (l: string) => {
    saveLocale(l);
    start(() => router.refresh());
  };
  return (
    <div role="group" aria-label={m.common.language} className={cn("inline-flex items-center gap-0.5 rounded-sm border border-white/35 p-0.5 text-xs", pending && "opacity-60", className)}>
      <Languages className="mx-1 size-3.5 opacity-80" aria-hidden />
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === current}
          onClick={() => l !== current && choose(l)}
          className={cn("rounded-[3px] px-1.5 py-0.5", l === current ? "bg-white font-semibold text-cobalt-deep" : "text-white/90 hover:bg-white/10")}
        >
          {l === "th" ? "TH" : "EN"}
          <span className="sr-only"> {LOCALE_NAMES[l]}</span>
        </button>
      ))}
    </div>
  );
}
