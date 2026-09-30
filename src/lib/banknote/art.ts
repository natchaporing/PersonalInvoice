// Banknote linework as standalone SVG files, served prerendered and immutable from /art/<name>.svg.
// Every stroke is `currentColor`, so pages reference a group with <use href="/art/x.svg#id"> and
// colour it from CSS (palette variables). That keeps it vector in PDFs and lets palettes recolour it.
import { guillocheBand, guillocheField, guillocheRosette } from "./geometry";

const doc = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const group = (id: string, d: string, width: number, pathAttrs = "") =>
  `<g id="${id}" fill="none" stroke="currentColor" stroke-width="${width}"><path d="${d}"${pathAttrs}/></g>`;

function rosette() {
  const layers = guillocheRosette();
  const join = (tone: 0 | 1) => layers.filter((l) => l.tone === tone).map((l) => l.d).join("");
  return doc(group("p", join(0), 0.35) + group("s", join(1), 0.35));
}

export const ART = {
  // Two groups (#p primary, #s accent) in a 200×200 box.
  "rosette-lines": () => rosette(),
  // One group (#f) in a 600×240 box (viewBox "0 -12 600 264"); hairline at any scale.
  "field-lines": () => doc(group("f", guillocheField({ width: 600, height: 240, lines: 44, amplitude: 10, waves: 2.5, seed: 11 }), 0.6, ' vector-effect="non-scaling-stroke"')),
  // One group (#b) tile of 120×24 that repeats horizontally.
  "band-lines": () => doc(group("b", guillocheBand({ width: 120, height: 24, waves: 2, lines: 12 }), 0.55)),
} as const;

export type ArtName = keyof typeof ART;
/** URL of a group inside an artwork, for <use href>. */
export const artRef = (name: ArtName, id: string) => `/art/${name}.svg#${id}`;
