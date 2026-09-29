export const THEMES = [
  { key: "ledger", label: "Ledger", th: "บัญชี", note: "Serif headings, mono figures, ruled sections" },
  { key: "official", label: "Official", th: "ราชการ", note: "Sarabun, boxed grid tables, like an RD form" },
  { key: "calm", label: "Calm", th: "นุ่มนวล", note: "Soft panels and filled fields, app-like" },
  { key: "bold", label: "Bold", th: "หนักแน่น", note: "Heavy rules and big numerals, poster-like" },
] as const;

export type ThemeKey = (typeof THEMES)[number]["key"];
export const THEME_COOKIE = "theme";
export const isTheme = (v: string | undefined): v is ThemeKey => THEMES.some((t) => t.key === v);
