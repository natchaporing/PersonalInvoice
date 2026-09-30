// Generates design/bai-satang.html: "Bai Satang" (ใบสตางค์) mark variations that merge the leaf and the coin.
// Run: npx tsx design/make-logos-bai-satang.ts
import { writeFileSync } from "node:fs";
import { petalBand, wovenRing } from "../src/lib/banknote/geometry";

const C = { cobalt: "#0047ab", deep: "#003580", amber: "#ffb854", gold: "#f4d03f", ink: "#1a2536", pearl: "#f9f9fb" };
const lines = (d: string, stroke: string, w = 0.5, op = 1) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`;
const SANS = "'IBM Plex Sans Thai','Noto Sans Thai',system-ui,sans-serif";
const SERIF = "'Source Serif 4','Noto Serif Thai',Georgia,serif";
const leaf = "M100 12 C162 44 180 114 100 188 C20 114 38 44 100 12Z";

// 1. Coin in the leaf: the leaf holds a small coin where its veins meet.
const m1 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Coin in leaf">
  <defs><clipPath id="l1"><path d="${leaf}"/></clipPath></defs>
  <path d="${leaf}" fill="${C.cobalt}"/>
  <g clip-path="url(#l1)">${lines(petalBand({ cx: 100, cy: 130, r0: 14, r1: 96, n: 14, strands: 6, p: 1.4 }), "#fff", 0.5, 0.5)}</g>
  <path d="${leaf}" fill="none" stroke="${C.amber}" stroke-width="3"/>
  <path d="M100 150 L100 188" stroke="${C.amber}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="100" cy="98" r="34" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  ${lines(wovenRing({ cx: 100, cy: 98, r: 26, a: 1.6, n: 36, strands: 3 }), C.amber, 0.5, 0.9)}
  <text x="100" y="113" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="42" fill="${C.gold}">฿</text>
</svg>`;

// 2. Leaf on the coin: a round coin with a leaf cut out of its face, a guilloche rim around it.
const m2 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Leaf on coin">
  <circle cx="100" cy="100" r="94" fill="${C.cobalt}"/>
  ${lines(wovenRing({ r: 87, a: 3, n: 60, strands: 4 }), C.amber, 0.6)}
  ${lines(petalBand({ r0: 64, r1: 82, n: 24, strands: 8, p: 1.3 }), "#fff", 0.45, 0.5)}
  <path d="M100 44 C136 62 146 104 100 158 C54 104 64 62 100 44Z" fill="${C.gold}"/>
  <path d="M100 58 L100 158" stroke="${C.deep}" stroke-width="3" stroke-linecap="round"/>
  <path d="M100 96 L124 78 M100 116 L130 96 M100 136 L122 118 M100 96 L76 78 M100 116 L70 96 M100 136 L78 118" stroke="${C.deep}" stroke-width="2.4" stroke-linecap="round"/>
</svg>`;

// 3. Leaf with a coin stem: a clean leaf whose midrib ends in a small coin, like a sprout with a coin.
const m3 = `
<svg viewBox="0 0 200 200" role="img" aria-label="Leaf with coin stem">
  <defs><clipPath id="l3"><path d="M100 10 C158 36 176 100 100 150 C24 100 42 36 100 10Z"/></clipPath></defs>
  <path d="M100 10 C158 36 176 100 100 150 C24 100 42 36 100 10Z" fill="${C.cobalt}"/>
  <g clip-path="url(#l3)">${lines(petalBand({ cx: 100, cy: 100, r0: 8, r1: 90, n: 14, strands: 6, p: 1.4 }), "#fff", 0.5, 0.5)}</g>
  <path d="M100 10 L100 150" stroke="${C.amber}" stroke-width="3" stroke-linecap="round"/>
  <path d="M100 60 L132 34 M100 88 L140 58 M100 116 L132 88" stroke="${C.amber}" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="100" cy="166" r="28" fill="${C.gold}" stroke="${C.deep}" stroke-width="3"/>
  <circle cx="100" cy="166" r="20" fill="none" stroke="${C.deep}" stroke-width="1.5"/>
  <text x="100" y="178" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="32" fill="${C.deep}">฿</text>
</svg>`;

const marks = [
  { n: "A · Coin in the leaf", m: m1, d: "The most literal merge: the leaf (ใบ) holds the coin (สตางค์). Rich and recognisable, but the busiest at small sizes." },
  { n: "B · Leaf on the coin", m: m2, d: "A coin with a gold leaf struck on its face. The strongest silhouette (a circle), so it works best as an app icon and a PDF seal." },
  { n: "C · Leaf with a coin stem", m: m3, d: "A sprout with a coin at its base: growth from small amounts. The most distinctive and least like other finance logos." },
];

const bai = (c: string, thai: string) => `<div class="wm"><span style="font:600 44px ${SERIF};color:${c}">bai</span><span style="font:500 30px ${SANS};color:${thai};margin-left:10px">ใบ</span></div>`;
const satang = (c: string) => `<div class="wm"><span style="font:600 42px ${SERIF};color:${c}">Satang</span></div>`;

const section = (k: (typeof marks)[number]) => `
<section class="card"><h2>${k.n}</h2>
  <div class="row">
    <div class="tile" style="background:#fff"><div class="lockup"><div class="mark">${k.m}</div>${bai(C.cobalt, C.amber)}</div></div>
    <div class="tile" style="background:${C.deep}"><div class="lockup"><div class="mark">${k.m}</div>${bai("#fff", C.amber)}</div></div>
    <div class="tile" style="background:#fff"><div class="lockup"><div class="mark">${k.m}</div>${satang(C.cobalt)}</div></div>
    <div class="tile" style="background:${C.deep}"><div class="lockup"><div class="mark">${k.m}</div>${satang("#fff")}</div></div>
    <div class="tile small" style="background:${C.pearl}"><div class="mark s">${k.m}</div><div class="mark xs">${k.m}</div></div>
  </div><p>${k.d}</p></section>`;

writeFileSync(
  new URL("./bai-satang.html", import.meta.url),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bai + Satang</title>
<style>
  body{margin:0;background:${C.pearl};color:${C.ink};font:15px/1.5 ${SANS};padding:32px 24px}
  h1{font:600 30px ${SERIF};margin:0 0 4px} h1 small{font:500 24px ${SANS};color:${C.cobalt}} .lead{margin:0 0 26px;color:#4b5666;max-width:64ch}
  .card{max-width:1120px;margin:0 auto 30px} h2{font:600 20px ${SERIF};margin:0 0 10px}
  .row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr .4fr;gap:12px} .tile{border:1px solid #dfe3ea;border-radius:12px;min-height:140px;display:flex;align-items:center;justify-content:center;padding:14px}
  .lockup{display:flex;align-items:center;gap:12px} .mark{width:76px;height:76px;flex:none} .tile.small{gap:14px;flex-direction:column} .mark.s{width:44px;height:44px} .mark.xs{width:24px;height:24px}
  .mark svg{width:100%;height:100%;display:block} .wm.col{display:flex;flex-direction:column;gap:2px} p{margin:8px 0 0;max-width:72ch;color:#3a4657}
  @media (max-width:860px){.row{grid-template-columns:1fr}}
</style>
<h1>Bai + Satang, one mark</h1>
<p class="lead">The two concepts merged in one symbol (the leaf/sheet from Bai, the coin from Satang), shown with either name. Pick a mark and a name independently.</p>
${marks.map(section).join("")}
</html>`,
);
console.log("wrote design/bai-satang.html");
