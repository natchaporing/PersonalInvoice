// Writes src/app/icon.svg (browser tab icon) with the default cobalt palette. Run: npx tsx design/make-favicon.ts
import { writeFileSync } from "node:fs";
import { petalBand, wovenRing } from "../src/lib/banknote/geometry";

const C = { cobalt: "#0047ab", deep: "#003580", amber: "#ffb854", gold: "#f4d03f" };
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<circle cx="100" cy="100" r="98" fill="${C.cobalt}"/>
<path d="${wovenRing({ r: 89, a: 3, n: 60, strands: 4 })}" fill="none" stroke="${C.amber}" stroke-width="0.8"/>
<path d="${petalBand({ r0: 66, r1: 84, n: 26, strands: 8, p: 1.3 })}" fill="none" stroke="#fff" stroke-width="0.6" opacity=".55"/>
<circle cx="100" cy="100" r="62" fill="${C.deep}"/>
<path d="M72 58H110L130 78V142H72Z" fill="#fff"/><path d="M110 58V78H130Z" fill="${C.amber}"/>
<path d="M82 92h36M82 105h36M82 118h22" stroke="${C.cobalt}" stroke-width="5" stroke-linecap="round"/>
<circle cx="118" cy="132" r="19" fill="${C.deep}" stroke="${C.gold}" stroke-width="4"/>
<circle cx="118" cy="132" r="7" fill="${C.gold}"/>
</svg>`;
writeFileSync(new URL("../src/app/icon.svg", import.meta.url), svg);
console.log("wrote src/app/icon.svg");
