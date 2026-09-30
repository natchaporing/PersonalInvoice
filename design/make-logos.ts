// Generates design/logo-proposals.html: four logo concepts built from the app's own guilloche geometry.
// Run: npx tsx design/make-logos.ts
import { writeFileSync } from "node:fs";
import { guillocheBand, petalBand, wovenRing } from "../src/lib/banknote/geometry";

const C = { cobalt: "#0047ab", deep: "#003580", amber: "#ffb854", gold: "#f4d03f", ink: "#1a2536", pearl: "#f9f9fb" };
const lines = (d: string, stroke: string, w = 0.5, op = 1) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" opacity="${op}"/>`;
const SANS = "'IBM Plex Sans Thai','Noto Sans Thai',system-ui,sans-serif";
const SERIF = "'Source Serif 4','Noto Serif Thai',Georgia,serif";

// A. Bai: a leaf (ใบ means both "leaf" and "sheet", as in every Thai document) with guilloche veins.
const leaf = "M100 14 C160 44 178 112 100 186 C22 112 40 44 100 14Z";
const markBai = `
<svg viewBox="0 0 200 200" role="img" aria-label="Bai logo mark">
  <defs><clipPath id="leaf"><path d="${leaf}"/></clipPath></defs>
  <path d="${leaf}" fill="${C.cobalt}"/>
  <g clip-path="url(#leaf)">${lines(petalBand({ cx: 100, cy: 128, r0: 10, r1: 92, n: 14, strands: 6, p: 1.4 }), "#fff", 0.55, 0.55)}</g>
  <path d="${leaf}" fill="none" stroke="${C.amber}" stroke-width="3"/>
  <path d="M100 30 L100 186" stroke="${C.amber}" stroke-width="3" stroke-linecap="round"/>
  <path d="M100 96 L136 66 M100 124 L142 90 M100 152 L132 124" stroke="${C.amber}" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
</svg>`;

// B. Satang: a coin, the smallest unit every amount here is stored in.
const markSatang = `
<svg viewBox="0 0 200 200" role="img" aria-label="Satang logo mark">
  <circle cx="100" cy="100" r="94" fill="${C.cobalt}"/>
  ${lines(wovenRing({ r: 86, a: 3, n: 60, strands: 4 }), C.amber, 0.6)}
  ${lines(petalBand({ r0: 44, r1: 78, n: 20, strands: 8, p: 1.3 }), "#fff", 0.45, 0.6)}
  <circle cx="100" cy="100" r="40" fill="${C.deep}" stroke="${C.gold}" stroke-width="3"/>
  <text x="100" y="118" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="56" fill="${C.gold}">฿</text>
</svg>`;

// C. Rosette: the guilloche rosette itself as the monogram.
const markRosette = `
<svg viewBox="0 0 200 200" role="img" aria-label="Rosette logo mark">
  ${lines(petalBand({ r0: 60, r1: 96, n: 20, strands: 9, p: 1.4 }), C.cobalt, 0.6)}
  ${lines(petalBand({ r0: 30, r1: 62, n: 14, strands: 7, p: 1.3 }), C.amber, 0.7)}
  ${lines(wovenRing({ r: 26, a: 3, n: 36, strands: 4 }), C.cobalt, 0.6)}
  <circle cx="100" cy="100" r="16" fill="${C.cobalt}"/>
  <circle cx="100" cy="100" r="6" fill="${C.gold}"/>
</svg>`;

// D. Bahtnote: a banknote, with a rosette in the corner and a guilloche band.
const markNote = `
<svg viewBox="0 0 240 150" role="img" aria-label="Bahtnote logo mark">
  <defs><clipPath id="note"><rect x="6" y="14" width="228" height="122" rx="10"/></clipPath></defs>
  <rect x="6" y="14" width="228" height="122" rx="10" fill="${C.cobalt}"/>
  <g clip-path="url(#note)">
    <g transform="translate(150 -30) scale(0.95)">${lines(petalBand({ r0: 40, r1: 96, n: 18, strands: 8, p: 1.4 }), "#fff", 0.5, 0.45)}</g>
    <g transform="translate(6 96)"><path d="${guillocheBand({ width: 228, height: 34 })}" fill="none" stroke="${C.amber}" stroke-width="0.6"/></g>
  </g>
  <rect x="6" y="14" width="228" height="122" rx="10" fill="none" stroke="${C.amber}" stroke-width="3"/>
  <rect x="16" y="24" width="208" height="102" rx="5" fill="none" stroke="#fff" stroke-width="0.8" opacity=".6"/>
  <circle cx="72" cy="72" r="30" fill="${C.deep}" stroke="${C.gold}" stroke-width="2.5"/>
  <text x="72" y="86" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="40" fill="${C.gold}">฿</text>
</svg>`;

interface Concept { name: string; thai?: string; tag: string; why: string; mark: string; word: (color: string) => string; wide?: boolean }
const concepts: Concept[] = [
  {
    name: "Bai", thai: "ใบ", tag: "ใบ = leaf and sheet",
    why: "“ใบ” starts every Thai business document: ใบกำกับภาษี, ใบเสนอราคา, ใบเสร็จ. It is also a leaf. Short, easy to say, easy to type.",
    mark: markBai,
    word: (c) => `<span style="font:600 44px ${SERIF};color:${c};letter-spacing:.01em">bai</span><span style="font:500 30px ${SANS};color:${C.amber};margin-left:10px">ใบ</span>`,
  },
  {
    name: "Satang", tag: "the smallest unit",
    why: "Every amount in the app is an exact whole number of satang, so nothing is ever rounded away. Reads as careful and honest with money.",
    mark: markSatang,
    word: (c) => `<span style="font:600 42px ${SERIF};color:${c}">Satang</span>`,
  },
  {
    name: "Rosette", tag: "the banknote motif",
    why: "Named after the guilloche rosette printed on banknotes: the signature of the design. Works as a symbol on its own, as a favicon and as a PDF seal.",
    mark: markRosette,
    word: (c) => `<span style="font:600 42px ${SERIF};color:${c}">Rosette</span>`,
  },
  {
    name: "Bahtnote", tag: "baht + banknote",
    why: "Says what it is: Thai money documents. The most literal option and the easiest to find by search, but the least ownable.",
    mark: markNote, wide: true,
    word: (c) => `<span style="font:600 40px ${SERIF};color:${c}">Bahtnote</span>`,
  },
];

const card = (k: Concept) => `
<section class="card">
  <h2>${k.name}${k.thai ? ` <small>${k.thai}</small>` : ""} <em>${k.tag}</em></h2>
  <div class="row">
    <div class="tile" style="background:#fff">
      <div class="lockup"><div class="mark${k.wide ? " wide" : ""}">${k.mark}</div>${k.word(C.cobalt)}</div>
    </div>
    <div class="tile" style="background:${C.deep}">
      <div class="lockup"><div class="mark${k.wide ? " wide" : ""}">${k.mark}</div>${k.word("#fff")}</div>
    </div>
    <div class="tile small" style="background:${C.pearl}"><div class="mark s">${k.mark}</div><div class="mark xs">${k.mark}</div></div>
  </div>
  <p>${k.why}</p>
</section>`;

writeFileSync(
  new URL("./logo-proposals.html", import.meta.url),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Logo proposals</title>
<style>
  body{margin:0;background:${C.pearl};color:${C.ink};font:15px/1.5 ${SANS};padding:32px 24px}
  h1{font:600 30px ${SERIF};margin:0 0 4px} .lead{margin:0 0 28px;color:#4b5666;max-width:60ch}
  .card{max-width:1080px;margin:0 auto 34px} h2{font:600 22px ${SERIF};margin:0 0 10px} h2 small{font:500 20px ${SANS};color:${C.cobalt}} h2 em{font:400 14px ${SANS};color:#5b6675;margin-left:8px}
  .row{display:grid;grid-template-columns:1.3fr 1.3fr .7fr;gap:14px} .tile{border:1px solid #dfe3ea;border-radius:12px;min-height:150px;display:flex;align-items:center;justify-content:center;padding:18px}
  .lockup{display:flex;align-items:center;gap:14px} .mark{width:84px;height:84px;flex:none} .mark.wide{width:120px;height:75px}
  .tile.small{gap:18px;flex-direction:column} .mark.s{width:44px;height:44px} .mark.xs{width:24px;height:24px} .mark.wide.s{width:60px;height:38px} .mark.wide.xs{width:36px;height:23px}
  .mark svg{width:100%;height:100%;display:block} p{margin:10px 0 0;max-width:70ch;color:#3a4657}
  @media (max-width:760px){.row{grid-template-columns:1fr}}
</style>
<h1>Logo proposals</h1>
<p class="lead">Four directions built from the app's own guilloche geometry, in the cobalt / amber / gold palette. Each is shown on white, on deep cobalt, and at favicon sizes.</p>
${concepts.map(card).join("")}
</html>`,
);
console.log("wrote design/logo-proposals.html");
