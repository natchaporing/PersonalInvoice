import { petalBand, wovenRing } from "@/lib/banknote/geometry";

// Circle seal mark: a guilloche ring around a page with a folded corner and a baht coin.
// Colours follow the active palette, so the mark recolours with it.
const RING = wovenRing({ r: 89, a: 3, n: 60, strands: 4 });
const PETALS = petalBand({ r0: 66, r1: 84, n: 26, strands: 8, p: 1.3 });

export function LogoMark({ size = 32, className, title = "Tra" }: { size?: number; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={title} className={className}>
      <circle cx="100" cy="100" r="96" fill="var(--cobalt)" stroke="#fff" strokeOpacity=".55" strokeWidth="3" />
      <path d={RING} fill="none" stroke="var(--amber)" strokeWidth="0.6" />
      <path d={PETALS} fill="none" stroke="#fff" strokeWidth="0.45" opacity=".55" />
      <circle cx="100" cy="100" r="62" fill="var(--cobalt-deep)" />
      <path d="M72 58 H110 L130 78 V142 H72Z" fill="#fff" />
      <path d="M110 58 V78 H130Z" fill="var(--amber)" />
      <path d="M82 92 h36 M82 105 h36 M82 118 h22" stroke="var(--cobalt)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="118" cy="132" r="18" fill="var(--cobalt-deep)" stroke="var(--gold)" strokeWidth="3" />
      <text x="118" y="143" textAnchor="middle" fontWeight="700" fontSize="24" fill="var(--gold)" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
        ฿
      </text>
    </svg>
  );
}
