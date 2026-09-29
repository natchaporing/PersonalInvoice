"use client";

import { useState } from "react";
import { THEME_COOKIE, THEMES, type ThemeKey } from "@/lib/themes";

export function ThemeSwitcher({ initial }: { initial: ThemeKey }) {
  const [theme, setTheme] = useState<ThemeKey>(initial);
  const choose = (key: ThemeKey) => {
    setTheme(key);
    document.documentElement.dataset.theme = key;
    document.cookie = `${THEME_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <label className="flex items-center gap-2 text-xs text-white/85">
      <span className="hidden sm:inline">Theme</span>
      <select
        value={theme}
        onChange={(e) => choose(e.target.value as ThemeKey)}
        className="min-h-8 rounded-sm border border-white/40 bg-transparent px-2 text-xs text-white [&>option]:text-fg"
        aria-label="Theme"
      >
        {THEMES.map((t) => (
          <option key={t.key} value={t.key}>{t.label} · {t.th}</option>
        ))}
      </select>
    </label>
  );
}
