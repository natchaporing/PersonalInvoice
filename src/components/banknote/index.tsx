// Banknote security-printing ornaments. Server-safe (no hooks); all purely decorative.
// Linework loads from cached /art/*.svg files as <use> references: every stroke is currentColor,
// so colours come from the active palette (CSS variables) and stay vector in PDFs.
import type { CSSProperties } from "react";
import { artRef } from "@/lib/banknote/art";
import { guillocheRing, wovenRing } from "@/lib/banknote/geometry";
import { cn } from "@/lib/utils";

/** Palette-aware colours. Any CSS colour also works. */
export const PALETTE_COLOR = {
  brand: "var(--cobalt)",
  accent: "var(--amber)",
  danger: "var(--destructive)",
  white: "#ffffff",
} as const;

type Tone = "brand" | "white";

/** Banknote rosette: primary rings plus an accent ring. `mono` draws both in the primary colour. */
export function Rosette({
  size = 160,
  tone = "brand",
  opacity = 0.9,
  className,
  style,
}: { size?: number; tone?: Tone | "mono"; opacity?: number; className?: string; style?: CSSProperties }) {
  const primary = tone === "white" ? PALETTE_COLOR.white : PALETTE_COLOR.brand;
  const secondary = tone === "mono" ? primary : PALETTE_COLOR.accent;
  return (
    <svg aria-hidden focusable={false} viewBox="0 0 200 200" width={size} height={size} className={cn("pointer-events-none select-none", className)} style={{ opacity, ...style }}>
      <use href={artRef("rosette-lines", "p")} style={{ color: primary }} />
      <use href={artRef("rosette-lines", "s")} style={{ color: secondary }} />
    </svg>
  );
}

/** Full-cover flowing-line texture. Parent must be `relative`. */
export function GuillocheBackground({ tone = "brand", opacity = 0.12, className }: { tone?: Tone; opacity?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      focusable={false}
      viewBox="0 -12 600 264"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity, color: tone === "white" ? PALETTE_COLOR.white : PALETTE_COLOR.brand }}
    >
      <use href={artRef("field-lines", "f")} />
    </svg>
  );
}

const BAND_COLOR = { brand: PALETTE_COLOR.brand, amber: PALETTE_COLOR.accent, red: PALETTE_COLOR.danger, white: PALETTE_COLOR.white } as const;

/** Interwoven ribbon, repeats horizontally to any width. (`brand` = palette primary, `amber` = palette accent.) */
export function GuillocheBand({
  tone = "brand",
  height = 12,
  opacity = 0.8,
  className,
}: { tone?: keyof typeof BAND_COLOR; height?: number; opacity?: number; className?: string }) {
  const id = `gb-${tone}-${height}`;
  return (
    <svg aria-hidden focusable={false} width="100%" height={height} className={cn("pointer-events-none block", className)} style={{ opacity, color: BAND_COLOR[tone] }}>
      <defs>
        <pattern id={id} width={height * 5} height={height} patternUnits="userSpaceOnUse" viewBox="0 0 120 24" preserveAspectRatio="none">
          <use href={artRef("band-lines", "b")} />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}

/** One line of tiny repeated text, like the microprint on currency. */
export function Microprint({
  text = "TRA · ตรา · ใบกำกับภาษี · TAX INVOICE · ",
  color = PALETTE_COLOR.brand,
  opacity = 0.75,
  size = 5,
  className = "",
}: { text?: string; color?: string; opacity?: number; size?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("overflow-hidden whitespace-nowrap uppercase select-none", className)}
      style={{ fontSize: size, lineHeight: 1.2, letterSpacing: "0.12em", color, opacity }}
    >
      {text.repeat(Math.ceil(600 / Math.max(8, text.length)))}
    </div>
  );
}

/** Banknote-style serial number. `emphasis` colour applies to the letter prefix. */
export function SerialNumber({
  value,
  color = PALETTE_COLOR.brand,
  emphasis = "var(--foreground)",
  className = "",
}: { value: string; color?: string; emphasis?: string; className?: string }) {
  const m = /^([A-Z]+)(.*)$/.exec(value);
  const [prefix, rest] = m ? [m[1], m[2]] : ["", value];
  return (
    <span className={cn("num tracking-[0.16em]", className)} style={{ color }}>
      <span style={{ color: emphasis }}>{prefix}</span>
      {rest}
    </span>
  );
}

/** Circular guilloche seal with text around the rim. Inline because its text varies. */
export function Seal({
  id = "seal",
  size = 88,
  text = "ต้นฉบับ · ORIGINAL · ต้นฉบับ · ORIGINAL · ",
  color = PALETTE_COLOR.brand,
  accent = PALETTE_COLOR.accent,
  opacity = 0.9,
  label,
  className,
}: { id?: string; size?: number; text?: string; color?: string; accent?: string; opacity?: number; label?: string; className?: string }) {
  const rim = guillocheRing({ cx: 50, cy: 50, radius: 46, amplitude: 1.6, lobes: 40, strands: 3, resolution: 8 });
  const core = wovenRing({ cx: 50, cy: 50, r: 22, a: 2.4, n: 28, strands: 4, resolution: 5 });
  const pathId = `seal-text-${id}`;
  const stroke = (c: string, w: number) => ({ fill: "none", stroke: c, strokeWidth: w }) as const;
  return (
    <svg aria-hidden focusable={false} viewBox="0 0 100 100" width={size} height={size} className={className} style={{ opacity }}>
      <defs>
        <path id={pathId} d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
      </defs>
      <path d={rim} style={stroke(color, 0.35)} />
      <circle cx="50" cy="50" r="40.5" style={stroke(color, 0.6)} />
      <circle cx="50" cy="50" r="29" style={stroke(color, 0.4)} />
      <text fontSize="6.2" letterSpacing="0.6" fontWeight={600} style={{ fill: color }}>
        <textPath href={`#${pathId}`}>{text}</textPath>
      </text>
      <path d={core} style={stroke(accent, 0.45)} />
      {label && (
        <text x="50" y="52.5" textAnchor="middle" fontSize="7" fontWeight={700} style={{ fill: color }}>
          {label}
        </text>
      )}
    </svg>
  );
}
