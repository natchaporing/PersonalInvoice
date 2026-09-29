// Banknote security-printing ornaments. Server-safe (no hooks); all purely decorative.
// Heavy linework (rosettes, fields, bands) loads from cached /art/*.svg files; only the
// small seal, microprint and serial number render inline.
import type { CSSProperties } from "react";
import { artUrl } from "@/lib/banknote/art";
import { BANKNOTE, guillocheRing, wovenRing } from "@/lib/banknote/geometry";
import { cn } from "@/lib/utils";

export { BANKNOTE };

type Tone = "cobalt" | "white";

/** Banknote rosette. `mono` is single-colour for watermarks. */
export function Rosette({
  size = 160,
  tone = "cobalt",
  opacity = 0.9,
  className,
  style,
}: { size?: number; tone?: Tone | "mono"; opacity?: number; className?: string; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, no optimisation needed
    <img
      src={artUrl(`rosette-${tone}`)}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity, ...style }}
    />
  );
}

/** Full-cover flowing-line texture. Parent must be `relative`. */
export function GuillocheBackground({ tone = "cobalt", opacity = 0.12, className }: { tone?: Tone; opacity?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ backgroundImage: `url(${artUrl(`field-${tone}`)})`, backgroundSize: "100% 100%", opacity }}
    />
  );
}

/** Interwoven ribbon, repeats horizontally to any width. */
export function GuillocheBand({
  tone = "cobalt",
  height = 12,
  opacity = 0.8,
  className,
}: { tone?: "cobalt" | "amber" | "red"; height?: number; opacity?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full", className)}
      style={{
        height,
        opacity,
        backgroundImage: `url(${artUrl(`band-${tone}`)})`,
        backgroundSize: `${height * 5}px ${height}px`,
        backgroundRepeat: "repeat-x",
      }}
    />
  );
}

/** One line of tiny repeated text, like the microprint on currency. */
export function Microprint({
  text = "PERSONALINVOICE · ใบกำกับภาษี · TAX INVOICE · ",
  color = BANKNOTE.cobalt,
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
  color = "var(--cobalt)",
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
  color = BANKNOTE.cobalt,
  accent = BANKNOTE.amber,
  opacity = 0.9,
  label,
  className,
}: { id?: string; size?: number; text?: string; color?: string; accent?: string; opacity?: number; label?: string; className?: string }) {
  const rim = guillocheRing({ cx: 50, cy: 50, radius: 46, amplitude: 1.6, lobes: 40, strands: 3, resolution: 8 });
  const core = wovenRing({ cx: 50, cy: 50, r: 22, a: 2.4, n: 28, strands: 4, resolution: 5 });
  const pathId = `seal-text-${id}`;
  return (
    <svg aria-hidden focusable={false} viewBox="0 0 100 100" width={size} height={size} className={className} opacity={opacity}>
      <defs>
        <path id={pathId} d="M50 50 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
      </defs>
      <path d={rim} fill="none" stroke={color} strokeWidth={0.35} />
      <circle cx="50" cy="50" r="40.5" fill="none" stroke={color} strokeWidth={0.6} />
      <circle cx="50" cy="50" r="29" fill="none" stroke={color} strokeWidth={0.4} />
      <text fontSize="6.2" fill={color} letterSpacing="0.6" fontWeight={600}>
        <textPath href={`#${pathId}`}>{text}</textPath>
      </text>
      <path d={core} fill="none" stroke={accent} strokeWidth={0.45} />
      {label && (
        <text x="50" y="52.5" textAnchor="middle" fontSize="7" fontWeight={700} fill={color}>
          {label}
        </text>
      )}
    </svg>
  );
}
