"use client";

import { Eraser, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number; w: number };
type Stroke = Point[];

const INK = "#16202e";
const W = 600; // drawing surface in CSS px; exported at 2× for sharp printing
const H = 200;
const SCALE = 2;

/** Pen width from pressure (stylus) or speed (mouse/finger): faster strokes draw thinner, like real ink. */
function width(pressure: number, speed: number) {
  if (pressure > 0 && pressure !== 0.5) return 1.2 + pressure * 3.2;
  return Math.max(1.3, Math.min(3.6, 3.6 - speed * 1.1));
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.length === 1) {
    ctx.beginPath();
    ctx.arc(s[0].x, s[0].y, s[0].w / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  // Smooth with quadratic curves through midpoints, varying the width segment by segment.
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1];
    const b = s[i];
    const prevMid = i > 1 ? { x: (s[i - 2].x + a.x) / 2, y: (s[i - 2].y + a.y) / 2 } : a;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    ctx.beginPath();
    ctx.lineWidth = (a.w + b.w) / 2;
    ctx.moveTo(prevMid.x, prevMid.y);
    ctx.quadraticCurveTo(a.x, a.y, mid.x, mid.y);
    ctx.stroke();
  }
}

/**
 * Handwritten signature on a canvas. Calls `onChange` with a transparent PNG data URL, trimmed to the ink
 * (or null when empty). Works with mouse, finger and stylus.
 */
export function SignaturePad({ onChange, className, label }: { onChange: (png: string | null) => void; className?: string; label?: string }) {
  const t = useMessages().pad;
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const last = useRef<{ x: number; y: number; t: number } | null>(null);
  const [count, setCount] = useState(0);

  const redraw = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes.current) drawStroke(ctx, s);
    if (current.current) drawStroke(ctx, current.current);
  }, []);

  /** Export only the inked area (plus a margin) as a transparent PNG. */
  const exportPng = useCallback(() => {
    const all = strokes.current.flat();
    if (!all.length) return onChange(null);
    const pad = 8;
    const minX = Math.max(0, Math.min(...all.map((p) => p.x - p.w)) - pad);
    const minY = Math.max(0, Math.min(...all.map((p) => p.y - p.w)) - pad);
    const maxX = Math.min(W, Math.max(...all.map((p) => p.x + p.w)) + pad);
    const maxY = Math.min(H, Math.max(...all.map((p) => p.y + p.w)) + pad);
    const out = document.createElement("canvas");
    out.width = Math.ceil((maxX - minX) * SCALE);
    out.height = Math.ceil((maxY - minY) * SCALE);
    out.getContext("2d")?.drawImage(canvas.current!, minX * SCALE, minY * SCALE, out.width, out.height, 0, 0, out.width, out.height);
    onChange(out.toDataURL("image/png"));
  }, [onChange]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    c.width = W * SCALE;
    c.height = H * SCALE;
    redraw();
  }, [redraw]);

  const point = (el: HTMLCanvasElement, e: { clientX: number; clientY: number; pointerType: string; pressure: number }): Point => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const now = performance.now();
    const speed = last.current ? Math.hypot(x - last.current.x, y - last.current.y) / Math.max(1, now - last.current.t) : 0;
    last.current = { x, y, t: now };
    return { x, y, w: width(e.pointerType === "pen" ? e.pressure : 0, speed) };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = null;
    current.current = [point(e.currentTarget, e)];
    redraw();
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    // Use coalesced events for smooth lines on fast movement where the browser provides them.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events) current.current.push(point(e.currentTarget, ev));
    redraw();
  };
  const up = () => {
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    setCount(strokes.current.length);
    redraw();
    exportPng();
  };

  const undo = () => {
    strokes.current.pop();
    setCount(strokes.current.length);
    redraw();
    exportPng();
  };
  const clear = () => {
    strokes.current = [];
    setCount(0);
    redraw();
    onChange(null);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="relative overflow-hidden rounded-md border border-input bg-white">
        <canvas
          ref={canvas}
          role="img"
          aria-label={label ?? t.label}
          className="block aspect-[3/1] w-full cursor-crosshair touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-[28%] border-b border-dashed border-neutral-300" />
        {count === 0 && <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400">{t.placeholder}</div>}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={undo} disabled={count === 0}><Undo2 /> {t.undo}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={count === 0}><Eraser /> {t.clear}</Button>
      </div>
    </div>
  );
}
