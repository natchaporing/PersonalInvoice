"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Shrinks a fixed-size page (e.g. A4 in px) to fit its container, keeping layout identical to print. */
export function ScaledPage({ width, height, maxScale = 1, children }: { width: number; height: number; maxScale?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(maxScale, entry.contentRect.width / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, maxScale]);

  return (
    <div ref={ref} className="w-full" style={{ height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}
