"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PALETTE_COOKIE, PALETTES, type PaletteKey } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/** Applies a palette to the page and remembers it. Kept outside the component: it writes to the document. */
function applyPalette(key: PaletteKey) {
  document.documentElement.dataset.palette = key;
  document.cookie = `${PALETTE_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
}

/** Header control to switch between the light palettes. Applies instantly and remembers the choice in a cookie. */
export function PalettePicker({ initial }: { initial: PaletteKey }) {
  const [palette, setPalette] = useState<PaletteKey>(initial);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const choose = (key: PaletteKey) => {
    setPalette(key);
    applyPalette(key);
    setOpen(false);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-sm border border-white/35 px-2 py-1 text-xs text-white/90 hover:bg-white/10"
      >
        <Palette className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Palette</span>
      </button>
      {open && (
        <ul role="listbox" aria-label="Colour palette" className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-md border bg-popover py-1 text-popover-foreground shadow-lg">
          {PALETTES.map((p) => (
            <li key={p.key} role="option" aria-selected={palette === p.key}>
              <button type="button" onClick={() => choose(p.key)} className={cn("flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary", palette === p.key && "bg-accent")}>
                <span aria-hidden className="flex shrink-0 overflow-hidden rounded-sm border">
                  {p.swatch.map((c) => (
                    <span key={c} className="block h-7 w-4" style={{ background: c }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{p.label} <span className="font-normal text-muted-foreground">· {p.th}</span></span>
                  <span className="block text-[12px] leading-snug text-muted-foreground">{p.note}</span>
                </span>
                {palette === p.key && <Check className="size-4 text-cobalt" aria-label="Selected" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
