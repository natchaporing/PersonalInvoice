// Generates design/square-circle.html: banknote + document marks in square and circle containers.
// Run: npx tsx design/make-logos-square-circle.ts
import { writeFileSync } from "node:fs";
import { guillocheBand, petalBand, wovenRing } from "../src/lib/banknote/geometry";

const C = { cobalt: "#0047ab", deep: "#003580", amber: "#ffb854", gold: "#f4d03f", ink: "#1a2536", pearl: "#f9f9fb" };
const lines = (d: string, stroke: string, w = 0.5, op = 1) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`;
const SANS = "'IBM Plex Sans Thai','Noto Sans Thai',system-ui,sans-serif";
const SERIF = "'Source Serif 4','Noto Serif Thai',Georgia,serif";
const baht = (x: number, y: number, size: number, fill: string) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${size}" fill="${fill}">฿</text>`;
const rules = (x: number, y: number, w: number, n: number, gap: number, color: string, sw = 5) =>
  Array.from({ length: n }, (_, i) => `<path d="M${x} ${y + i * gap} h${i === n - 1 ? w * 0.6 : w}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`).join("");
const page = "M58 30 H118 L150 62 V170 H58Z";

// SQUARE 1 · Page in a note: cobalt tile with guilloche, a white page with folded corner, a gold ฿ seal on it.
const s1 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Square 1">
  <defs><clipPath id="sq1"><rect width="200" height="200" rx="44"/></clipPath></defs>
  <rect width="200" height="200" rx="44" fill="${C.cobalt}"/>
  <g clip-path="url(#sq1)">
    <g transform="translate(160 40)">${lines(petalBand({ cx: 0, cy: 0, r0: 20, r1: 110, n: 20, strands: 9, p: 1.4 }), "#fff", 0.5, 0.28)}</g>
    <g transform="translate(0 150)"><path d="${guillocheBand({ width: 200, height: 40 })}" fill="none" stroke="${C.amber}" stroke-width="0.6" opacity=".9"/></g>
  </g>
  <path d="${page}" fill="#fff"/><path d="M118 30 V62 H150Z" fill="${C.amber}"/>
  ${rules(74, 88, 60, 3, 18, C.cobalt, 5)}
  <circle cx="132" cy="150" r="34" fill="${C.deep}" stroke="${C.gold}" stroke-width="4"/>
  ${baht(132, 164, 44, C.gold)}
</svg>`;

// SQUARE 2 · Diagonal split: rosette in one corner, ruled document lines in the other, an amber thread between.
const s2 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Square 2">
  <defs><clipPath id="sq2"><rect width="200" height="200" rx="44"/></clipPath></defs>
  <rect width="200" height="200" rx="44" fill="#fff"/>
  <g clip-path="url(#sq2)">
    <path d="M200 0 V200 H0Z" fill="${C.cobalt}"/>
    <g transform="translate(140 140)">${lines(petalBand({ cx: 0, cy: 0, r0: 16, r1: 92, n: 18, strands: 8, p: 1.4 }), "#fff", 0.5, 0.5)}</g>
    <path d="M200 0 L0 200" stroke="${C.amber}" stroke-width="10"/>
    ${rules(34, 50, 62, 4, 22, C.cobalt, 6)}
  </g>
  <circle cx="140" cy="140" r="26" fill="${C.deep}" stroke="${C.gold}" stroke-width="4"/>
  ${baht(140, 152, 34, C.gold)}
  <rect x="3" y="3" width="194" height="194" rx="42" fill="none" stroke="${C.cobalt}" stroke-width="6"/>
</svg>`;

// SQUARE 3 · Banknote frame: double border and corner rosettes around a document, seal at the bottom.
const corner = (x: number, y: number) => `<g transform="translate(${x} ${y})">${lines(petalBand({ cx: 0, cy: 0, r0: 5, r1: 22, n: 12, strands: 6, p: 1.4 }), C.amber, 0.5, 0.9)}</g>`;
const s3 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Square 3">
  <rect width="200" height="200" rx="44" fill="${C.cobalt}"/>
  <rect x="12" y="12" width="176" height="176" rx="34" fill="none" stroke="${C.amber}" stroke-width="3"/>
  <rect x="20" y="20" width="160" height="160" rx="28" fill="none" stroke="#fff" stroke-width="1" opacity=".55"/>
  ${corner(38, 38)}${corner(162, 38)}${corner(38, 162)}${corner(162, 162)}
  <rect x="66" y="42" width="68" height="88" rx="6" fill="#fff"/>
  ${rules(78, 62, 44, 3, 16, C.cobalt, 5)}
  <circle cx="100" cy="146" r="22" fill="${C.deep}" stroke="${C.gold}" stroke-width="3.5"/>
  ${baht(100, 158, 30, C.gold)}
</svg>`;

// CIRCLE 1 · Seal: a guilloche seal ring around a white page, with the ฿ coin on the page.
const c1 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Circle 1">
  <circle cx="100" cy="100" r="96" fill="${C.cobalt}"/>
  ${lines(wovenRing({ r: 89, a: 3, n: 60, strands: 4 }), C.amber, 0.6)}
  ${lines(petalBand({ r0: 66, r1: 84, n: 26, strands: 8, p: 1.3 }), "#fff", 0.45, 0.55)}
  <circle cx="100" cy="100" r="62" fill="${C.deep}"/>
  <path d="M72 58 H110 L130 78 V142 H72Z" fill="#fff"/><path d="M110 58 V78 H130Z" fill="${C.amber}"/>
  ${rules(82, 92, 36, 3, 13, C.cobalt, 4)}
  <circle cx="118" cy="132" r="18" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${baht(118, 143, 24, C.gold)}
</svg>`;

// CIRCLE 2 · Coin of lines: a gold-rimmed coin whose lower half is printed lines (the document) under a ฿.
const c2 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Circle 2">
  <defs><clipPath id="ci2"><circle cx="100" cy="100" r="80"/></clipPath></defs>
  <circle cx="100" cy="100" r="96" fill="${C.cobalt}"/>
  <circle cx="100" cy="100" r="88" fill="none" stroke="${C.gold}" stroke-width="3"/>
  ${lines(petalBand({ r0: 82, r1: 94, n: 40, strands: 6, p: 1.2 }), "#fff", 0.4, 0.5)}
  <g clip-path="url(#ci2)">
    <rect x="20" y="104" width="160" height="80" fill="#fff"/>
    ${rules(52, 122, 96, 4, 15, C.cobalt, 5)}
    <rect x="20" y="102" width="160" height="6" fill="${C.amber}"/>
  </g>
  ${baht(100, 90, 60, C.gold)}
</svg>`;

// CIRCLE 3 · Thread: a round seal crossed by a vertical amber security thread, page fold at the top-right.
const c3 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Circle 3">
  <defs><clipPath id="ci3"><circle cx="100" cy="100" r="96"/></clipPath></defs>
  <circle cx="100" cy="100" r="96" fill="#fff" stroke="${C.cobalt}" stroke-width="6"/>
  <g clip-path="url(#ci3)">
    <g transform="translate(100 100)">${lines(petalBand({ cx: 0, cy: 0, r0: 30, r1: 100, n: 22, strands: 9, p: 1.4 }), C.cobalt, 0.5, 0.35)}</g>
    <path d="M150 0 V50 H200 V0Z" fill="${C.amber}"/><path d="M150 4 L196 50" stroke="${C.cobalt}" stroke-width="3"/>
    <rect x="88" y="0" width="24" height="200" fill="${C.amber}"/><rect x="88" y="0" width="24" height="200" fill="none" stroke="${C.cobalt}" stroke-width="2.5"/>
    ${rules(30, 78, 42, 3, 22, C.cobalt, 6)}
  </g>
  <circle cx="100" cy="100" r="30" fill="${C.deep}" stroke="${C.gold}" stroke-width="4"/>
  ${baht(100, 114, 40, C.gold)}
</svg>`;

const opts = [
  { n: "Square 1 · Page on a note", m: s1, d: "A white page with a folded corner and a ฿ seal on a guilloche cobalt tile. The most direct “document on a banknote”." },
  { n: "Square 2 · Diagonal split", m: s2, d: "Ruled lines in one half, banknote rosette in the other, cut by an amber security thread. The boldest and most graphic." },
  { n: "Square 3 · Banknote frame", m: s3, d: "A double banknote border with corner rosettes around a small document and a ฿ seal. The most authentic banknote feel." },
  { n: "Circle 1 · Seal", m: c1, d: "A guilloche seal ring around a page and coin. Doubles as the PDF stamp and reads as “issued and signed”." },
  { n: "Circle 2 · Coin of lines", m: c2, d: "A coin: ฿ above, printed document lines below, one amber rule between. The simplest, and clear at favicon size." },
  { n: "Circle 3 · Thread", m: c3, d: "A round rosette crossed by an amber security thread, page fold at the corner, ฿ at the crossing. The most banknote-like circle." },
];

const tile = (bg: string, m: string) => `<div class="tile" style="background:${bg}"><div class="mark">${m}</div></div>`;
const card = (k: (typeof opts)[number]) => `
<section class="card"><h2>${k.n}</h2>
  <div class="row">${tile("#fff", k.m)}${tile(C.deep, k.m)}${tile(C.pearl, `<div style="display:flex;gap:14px;align-items:center"><div style="width:48px;height:48px">${k.m}</div><div style="width:28px;height:28px">${k.m}</div><div style="width:16px;height:16px">${k.m}</div></div>`).replace('class="mark"', 'class="mark row-s"')}</div>
  <p>${k.d}</p></section>`;

writeFileSync(
  new URL("./square-circle.html", import.meta.url),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Square and circle marks</title>
<style>
  body{margin:0;background:${C.pearl};color:${C.ink};font:15px/1.5 ${SANS};padding:32px 24px}
  h1{font:600 30px ${SERIF};margin:0 0 4px} .lead{margin:0 0 26px;color:#4b5666;max-width:64ch}
  .grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:26px 22px} h2{font:600 18px ${SERIF};margin:0 0 8px}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:10px} .tile{border:1px solid #dfe3ea;border-radius:12px;min-height:160px;display:flex;align-items:center;justify-content:center;padding:12px}
  .row .tile:nth-child(3){grid-column:1/-1;min-height:90px} .mark{width:110px;height:110px} .mark.row-s{width:auto;height:auto}
  .mark svg{width:100%;height:100%;display:block} p{margin:8px 0 0;color:#3a4657;font-size:14px}
  @media (max-width:980px){.grid{grid-template-columns:1fr 1fr}} @media (max-width:640px){.grid{grid-template-columns:1fr}}
</style>
<h1>Square and circle marks</h1>
<p class="lead">Banknote + document in app-icon shapes. Top row: rounded squares. Bottom row: circles. Each on white, on cobalt, and at 48 / 28 / 16 px.</p>
<div class="grid">${opts.map(card).join("")}</div>
</html>`,
);
console.log("wrote design/square-circle.html");
