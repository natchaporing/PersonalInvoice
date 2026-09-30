// Generates design/note-document.html: banknote + document mark options.
// Run: npx tsx design/make-logos-note-doc.ts
import { writeFileSync } from "node:fs";
import { guillocheBand, petalBand, wovenRing } from "../src/lib/banknote/geometry";

const C = { cobalt: "#0047ab", deep: "#003580", amber: "#ffb854", gold: "#f4d03f", ink: "#1a2536", pearl: "#f9f9fb" };
const lines = (d: string, stroke: string, w = 0.5, op = 1) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`;
const SANS = "'IBM Plex Sans Thai','Noto Sans Thai',system-ui,sans-serif";
const SERIF = "'Source Serif 4','Noto Serif Thai',Georgia,serif";
const baht = (x: number, y: number, size: number, fill: string) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="${size}" fill="${fill}">฿</text>`;
const textLines = (x: number, y: number, w: number, n: number, gap: number, color: string, sw = 4) =>
  Array.from({ length: n }, (_, i) => `<path d="M${x} ${y + i * gap} h${i === n - 1 ? w * 0.6 : w}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`).join("");

// 1. Folded note: a landscape banknote with a folded corner, like a document page.
const o1 = `
<svg viewBox="0 0 240 170" role="img" aria-label="Folded note">
  <defs><clipPath id="c1"><path d="M8 20 H190 L232 62 V150 H8Z"/></clipPath></defs>
  <path d="M8 20 H190 L232 62 V150 H8Z" fill="${C.cobalt}"/>
  <g clip-path="url(#c1)">
    <g transform="translate(150 105)">${lines(petalBand({ cx: 0, cy: 0, r0: 30, r1: 96, n: 18, strands: 8, p: 1.4 }), "#fff", 0.5, 0.4)}</g>
    <g transform="translate(8 118)"><path d="${guillocheBand({ width: 224, height: 32 })}" fill="none" stroke="${C.amber}" stroke-width="0.6"/></g>
  </g>
  <path d="M190 20 V62 H232Z" fill="${C.amber}"/>
  <path d="M8 20 H190 L232 62 V150 H8Z" fill="none" stroke="${C.amber}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="70" cy="80" r="32" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${baht(70, 95, 42, C.gold)}
  ${textLines(120, 54, 50, 1, 0, "#fff", 4)}
</svg>`;

// 2. Sheet with seal: portrait document, ruled text, a guilloche seal stamped over the corner.
const o2 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Sheet with seal">
  <rect x="34" y="10" width="116" height="160" rx="8" fill="${C.cobalt}"/>
  ${textLines(52, 40, 80, 5, 20, "#fff", 5)}
  <path d="M52 38 h44" stroke="${C.amber}" stroke-width="5" stroke-linecap="round"/>
  <g transform="translate(138 138)">
    <circle r="50" fill="#fff"/>
    <circle r="46" fill="${C.deep}"/>
    ${lines(petalBand({ cx: 0, cy: 0, r0: 24, r1: 44, n: 14, strands: 7, p: 1.4 }), C.amber, 0.5, 0.9)}
    ${lines(wovenRing({ cx: 0, cy: 0, r: 22, a: 2, n: 32, strands: 3 }), "#fff", 0.5, 0.8)}
    <circle r="16" fill="${C.gold}"/>
    ${baht(0, 11, 30, C.deep)}
  </g>
</svg>`;

// 3. Split: half document lines, half banknote rosette, joined by a security thread.
const o3 = `
<svg viewBox="0 0 240 170" role="img" aria-label="Split note and document">
  <defs><clipPath id="c3"><rect x="8" y="16" width="224" height="138" rx="10"/></clipPath></defs>
  <rect x="8" y="16" width="224" height="138" rx="10" fill="#fff" stroke="${C.cobalt}" stroke-width="4"/>
  ${textLines(28, 46, 84, 5, 22, C.cobalt, 5)}
  <g clip-path="url(#c3)"><rect x="128" y="16" width="104" height="138" fill="${C.cobalt}"/>
    <g transform="translate(180 85)">${lines(petalBand({ cx: 0, cy: 0, r0: 18, r1: 70, n: 16, strands: 8, p: 1.4 }), "#fff", 0.5, 0.55)}</g>
  </g>
  <rect x="120" y="16" width="10" height="138" fill="${C.amber}"/>
  <circle cx="180" cy="85" r="24" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${baht(180, 98, 34, C.gold)}
</svg>`;

// 4. Stack: a page behind a banknote, both offset, like an invoice attached to a note.
const o4 = `
<svg viewBox="0 0 220 190" role="img" aria-label="Note on a page">
  <rect x="14" y="8" width="110" height="150" rx="8" fill="#fff" stroke="${C.cobalt}" stroke-width="4"/>
  ${textLines(30, 34, 76, 5, 18, C.cobalt, 4.5)}
  <defs><clipPath id="c4"><rect x="60" y="64" width="150" height="112" rx="9"/></clipPath></defs>
  <rect x="60" y="64" width="150" height="112" rx="9" fill="${C.cobalt}" stroke="#fff" stroke-width="4"/>
  <g clip-path="url(#c4)"><g transform="translate(160 120)">${lines(petalBand({ cx: 0, cy: 0, r0: 22, r1: 74, n: 16, strands: 8, p: 1.4 }), "#fff", 0.5, 0.45)}</g>
    <g transform="translate(60 148)"><path d="${guillocheBand({ width: 150, height: 28 })}" fill="none" stroke="${C.amber}" stroke-width="0.6"/></g></g>
  <rect x="60" y="64" width="150" height="112" rx="9" fill="none" stroke="${C.amber}" stroke-width="3"/>
  <circle cx="106" cy="112" r="26" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${baht(106, 124, 34, C.gold)}
</svg>`;

// 5. Note-bordered page: a portrait document with a banknote guilloche border and a ฿ window.
const o5 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Note-bordered page">
  <defs><clipPath id="c5"><path d="M46 8 H124 L156 40 V192 H46Z"/></clipPath></defs>
  <path d="M46 8 H124 L156 40 V192 H46Z" fill="${C.cobalt}"/>
  <g clip-path="url(#c5)">
    <g transform="translate(100 150)">${lines(petalBand({ cx: 0, cy: 0, r0: 16, r1: 100, n: 18, strands: 8, p: 1.4 }), "#fff", 0.5, 0.35)}</g>
  </g>
  <path d="M124 8 V40 H156Z" fill="${C.amber}"/>
  <path d="M46 8 H124 L156 40 V192 H46Z" fill="none" stroke="${C.amber}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M56 18 H116 V48" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
  <rect x="66" y="64" width="70" height="8" rx="4" fill="#fff"/><rect x="66" y="82" width="52" height="8" rx="4" fill="#fff" opacity=".7"/>
  <circle cx="101" cy="140" r="30" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${baht(101, 154, 40, C.gold)}
</svg>`;

// 6. Thread: a portrait sheet with a vertical security thread and ruled lines; the thread carries a ฿.
const o6 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Document with security thread">
  <rect x="36" y="8" width="128" height="184" rx="10" fill="#fff" stroke="${C.cobalt}" stroke-width="5"/>
  ${textLines(54, 40, 44, 6, 22, C.cobalt, 5)}
  <rect x="118" y="8" width="20" height="184" fill="${C.amber}"/>
  <rect x="118" y="8" width="20" height="184" fill="none" stroke="${C.cobalt}" stroke-width="2"/>
  <circle cx="128" cy="100" r="30" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${lines(wovenRing({ cx: 128, cy: 100, r: 23, a: 1.6, n: 30, strands: 3 }), C.amber, 0.5, 0.9)}
  ${baht(128, 113, 38, C.gold)}
</svg>`;

const opts = [
  { n: "1 · Folded note", m: o1, wide: true, d: "A banknote with a dog-eared corner: money that is also a page. Reads instantly as both. Corner fold in amber." },
  { n: "2 · Sheet with a seal", m: o2, d: "A ruled document with a guilloche seal stamped over its corner, like an issued, signed tax invoice. The seal doubles as the PDF stamp." },
  { n: "3 · Split note / page", m: o3, wide: true, d: "Half printed lines, half banknote rosette, joined by an amber security thread. The clearest “both halves” idea." },
  { n: "4 · Note on a page", m: o4, d: "A banknote laid on an invoice page: the invoice and the money it asks for. Most illustrative; the busiest at small sizes." },
  { n: "5 · Note-bordered page", m: o5, d: "A portrait page with a folded corner, banknote guilloche and a ฿ medallion. The most banknote-like; a single bold silhouette." },
  { n: "6 · Security thread", m: o6, d: "A clean white page with an amber security thread carrying the ฿ coin. The simplest and best at favicon size." },
];

const tile = (bg: string, m: string, wide?: boolean, cls = "") => `<div class="tile ${cls}" style="background:${bg}"><div class="mark${wide ? " wide" : ""}">${m}</div></div>`;
const card = (k: (typeof opts)[number]) => `
<section class="card"><h2>${k.n}</h2>
  <div class="row">${tile("#fff", k.m, k.wide)}${tile(C.deep, k.m, k.wide)}
    <div class="tile small" style="background:${C.pearl}"><div class="mark s${k.wide ? " wide" : ""}">${k.m}</div><div class="mark xs${k.wide ? " wide" : ""}">${k.m}</div></div></div>
  <p>${k.d}</p></section>`;

writeFileSync(
  new URL("./note-document.html", import.meta.url),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Banknote + document</title>
<style>
  body{margin:0;background:${C.pearl};color:${C.ink};font:15px/1.5 ${SANS};padding:32px 24px}
  h1{font:600 30px ${SERIF};margin:0 0 4px} .lead{margin:0 0 26px;color:#4b5666;max-width:64ch}
  .grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:26px 30px} h2{font:600 19px ${SERIF};margin:0 0 8px}
  .row{display:grid;grid-template-columns:1fr 1fr .5fr;gap:10px} .tile{border:1px solid #dfe3ea;border-radius:12px;min-height:170px;display:flex;align-items:center;justify-content:center;padding:14px}
  .mark{width:120px;height:120px} .mark.wide{width:150px;height:106px} .tile.small{gap:14px;flex-direction:column} .mark.s{width:44px;height:44px} .mark.xs{width:24px;height:24px}
  .mark.wide.s{width:56px;height:40px} .mark.wide.xs{width:34px;height:24px} .mark svg{width:100%;height:100%;display:block} p{margin:8px 0 0;color:#3a4657}
  @media (max-width:900px){.grid{grid-template-columns:1fr}}
</style>
<h1>Banknote + document</h1>
<p class="lead">Six ways to put the two ideas in one symbol: the banknote (guilloche, rosette, security thread) and the document (page, ruled lines, folded corner, seal). Names not applied.</p>
<div class="grid">${opts.map(card).join("")}</div>
</html>`,
);
console.log("wrote design/note-document.html");
