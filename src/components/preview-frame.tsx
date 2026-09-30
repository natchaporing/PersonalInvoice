"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ScaledPage } from "@/components/scaled-page";
import { cn } from "@/lib/utils";

/**
 * A4 document preview with a full-screen mode. The document is rendered once and only its frame changes,
 * so a live editor preview keeps updating while full screen. Esc closes it.
 */
export function PreviewFrame({ width, height, title = "Document preview", children }: { width: number; height: number; title?: string; children: React.ReactNode }) {
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [full]);

  const frame = (
    <div
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-label={full ? title : undefined}
      className={cn(full ? "fixed inset-0 z-50 overflow-y-auto bg-neutral-900/85 px-3 pt-14 pb-8 backdrop-blur-sm sm:px-8" : "flex flex-col")}
      onClick={full ? (e) => e.target === e.currentTarget && setFull(false) : undefined}
    >
      <button
        type="button"
        onClick={() => setFull((f) => !f)}
        aria-label={full ? "Close full screen" : "View full screen"}
        className={cn(
          "z-10 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium shadow-sm",
          full ? "fixed top-3 right-3 border-white/30 bg-white text-foreground hover:bg-secondary sm:right-6" : "mb-2 ml-auto flex bg-card text-foreground hover:bg-secondary",
        )}
      >
        {full ? <X className="size-3.5" aria-hidden /> : <Maximize2 className="size-3.5" aria-hidden />}
        {full ? "Close" : "Full screen"}
      </button>
      <div className={cn(full && "mx-auto max-w-[1120px]")}>
        <div data-slot="preview-page" className="overflow-hidden rounded-md border bg-white shadow-[0_1px_0_var(--border),0_14px_34px_-18px_rgb(26_37_54/0.4)]">
          <ScaledPage width={width} height={height} maxScale={full ? 1.4 : 1}>
            {children}
          </ScaledPage>
        </div>
      </div>
    </div>
  );

  // Full screen goes to <body> so no transformed ancestor can trap the fixed overlay.
  if (full) return <div style={{ minHeight: 200 }}>{createPortal(frame, document.body)}</div>;
  return frame;
}
