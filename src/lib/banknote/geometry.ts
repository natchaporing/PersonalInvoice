// Deterministic generators for banknote-style security linework (guilloche).
// Every function returns an SVG path `d` string; same input always yields the same string.

export const BANKNOTE = {
  cobalt: "#0047ab",
  amber: "#ffb854",
  gold: "#f4d03f",
  ink: "#1a2536",
  pearl: "#f9f9fb",
  white: "#ffffff",
} as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

function polyline(points: [number, number][]): string {
  if (points.length === 0) return "";
  let d = `M${r2(points[0][0])} ${r2(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += `L${r2(points[i][0])} ${r2(points[i][1])}`;
  return d;
}

/** Closed polar curve through `pts`. */
const closed = (pts: [number, number][]) => polyline(pts) + "Z";

/**
 * Woven ring: `strands` curves rho = r + a·sin(n·θ + φk), phase-shifted so they braid
 * into the rope-like bands seen on banknote rosettes.
 */
export function wovenRing({ cx = 100, cy = 100, r = 50, a = 4, n = 48, strands = 5, resolution = 6 } = {}): string {
  const steps = n * resolution;
  const parts: string[] = [];
  for (let k = 0; k < strands; k++) {
    const phi = (k * 2 * Math.PI) / strands;
    const pts: [number, number][] = [];
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const rho = r + a * Math.sin(n * t + phi);
      pts.push([cx + rho * Math.cos(t), cy + rho * Math.sin(t)]);
    }
    parts.push(closed(pts));
  }
  return parts.join("");
}

/**
 * Petal band: curves swinging between r0 and r1, rho = r0 + (r1-r0)·|sin(nθ/2 + φk)|^p.
 * Phase-shifted strands overlap into the lattice of a guilloche rosette.
 */
export function petalBand({ cx = 100, cy = 100, r0 = 60, r1 = 94, n = 24, strands = 10, p = 1.2, resolution = 10 } = {}): string {
  const steps = n * resolution;
  const parts: string[] = [];
  for (let k = 0; k < strands; k++) {
    const phi = (k * Math.PI) / strands;
    const pts: [number, number][] = [];
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * 2 * Math.PI;
      const rho = r0 + (r1 - r0) * Math.abs(Math.sin((n * t) / 2 + phi)) ** p;
      pts.push([cx + rho * Math.cos(t), cy + rho * Math.sin(t)]);
    }
    parts.push(closed(pts));
  }
  return parts.join("");
}

export interface RosetteLayer {
  d: string;
  /** Index into the caller's colour list: 0 = primary, 1 = secondary. */
  tone: 0 | 1;
}

/**
 * Banknote rosette in a 200×200 box: concentric petal bands and woven rings,
 * scalloped outer edge. Returned as layers so callers can colour bands separately.
 */
export function guillocheRosette(): RosetteLayer[] {
  return [
    { d: petalBand({ r0: 74, r1: 96, n: 18, strands: 5, p: 1.6 }), tone: 0 },
    { d: petalBand({ r0: 58, r1: 90, n: 24, strands: 8, p: 1.2 }), tone: 0 },
    { d: wovenRing({ r: 52, a: 4, n: 48, strands: 5 }), tone: 0 },
    { d: petalBand({ r0: 26, r1: 48, n: 16, strands: 8, p: 1.6 }), tone: 1 },
    { d: wovenRing({ r: 22, a: 2.5, n: 30, strands: 4 }), tone: 0 },
    { d: petalBand({ r0: 6, r1: 18, n: 12, strands: 6, p: 2 }), tone: 0 },
  ];
}

export interface BandOptions {
  /** Tile width. Bands are drawn so the left and right edges match and can repeat. */
  width?: number;
  height?: number;
  /** Full sine periods across one tile. */
  waves?: number;
  /** Number of interwoven lines. */
  lines?: number;
  /** Amplitude as a fraction of half the height (0..1). */
  amplitude?: number;
  /** Phase offset between consecutive lines, in radians. */
  phaseStep?: number;
  /** Samples per wave. */
  resolution?: number;
}

/**
 * Interwoven ribbon: many phase-shifted, amplitude-modulated sines. Periodic in x,
 * so a tile of `width` repeats seamlessly.
 */
export function guillocheBand({
  width = 240,
  height = 28,
  waves = 3,
  lines = 14,
  amplitude = 0.9,
  phaseStep = Math.PI / 7,
  resolution = 40,
}: BandOptions = {}): string {
  const mid = height / 2;
  const A = (height / 2) * amplitude;
  const steps = waves * resolution;
  const parts: string[] = [];
  for (let k = 0; k < lines; k++) {
    const phase = k * phaseStep;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const t = (i / steps) * waves * 2 * Math.PI;
      // Second harmonic modulates the envelope so the strands braid instead of running parallel.
      const env = 0.55 + 0.45 * Math.cos(t / 2 + phase / 2) ** 2;
      const y = mid + A * env * Math.sin(t + phase);
      pts.push([x, y]);
    }
    parts.push(polyline(pts));
  }
  return parts.join("");
}

export interface FieldOptions {
  width?: number;
  height?: number;
  /** Number of wavy horizontal lines. */
  lines?: number;
  /** Wave amplitude in px. */
  amplitude?: number;
  /** Waves across the width. */
  waves?: number;
  resolution?: number;
  seed?: number;
}

/** Seeded PRNG (mulberry32). */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * All-over background texture: closely spaced lines whose phase drifts slowly,
 * producing the moiré-like "flowing" fields printed behind banknote portraits.
 */
export function guillocheField({
  width = 600,
  height = 200,
  lines = 48,
  amplitude = 9,
  waves = 2.5,
  resolution = 28,
  seed = 7,
}: FieldOptions = {}): string {
  const rand = prng(seed);
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const gap = height / (lines - 1);
  const steps = Math.round(waves * resolution);
  const parts: string[] = [];
  for (let k = 0; k < lines; k++) {
    const y0 = k * gap;
    const drift = (k / lines) * Math.PI * 1.6;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = u * width;
      const t = u * waves * 2 * Math.PI;
      const y = y0 + amplitude * Math.sin(t + drift + p1) * (0.6 + 0.4 * Math.sin(t / 3 + p2 + drift / 2));
      pts.push([x, y]);
    }
    parts.push(polyline(pts));
  }
  return parts.join("");
}

/** Concentric ring of small rosette lobes, used as a seal's outer border. */
export function guillocheRing({ cx = 50, cy = 50, radius = 44, amplitude = 3, lobes = 36, strands = 4, resolution = 10 } = {}): string {
  const steps = lobes * resolution;
  const parts: string[] = [];
  for (let s = 0; s < strands; s++) {
    const phase = (s * Math.PI * 2) / strands / lobes;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const rr = radius + amplitude * Math.sin(lobes * (a + phase));
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    parts.push(polyline(pts) + "Z");
  }
  return parts.join("");
}
