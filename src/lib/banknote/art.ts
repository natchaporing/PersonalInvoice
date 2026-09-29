// Named banknote artworks rendered to standalone SVG documents. Served as static,
// cacheable files from /art/<name>.svg so pages reference them instead of inlining
// tens of kilobytes of path data.
import { BANKNOTE, guillocheBand, guillocheField, guillocheRosette } from "./geometry";

const { cobalt, amber, white } = BANKNOTE;

const doc = (viewBox: string, body: string, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${extra}>${body}</svg>`;

function rosette(primary: string, secondary: string, width = 0.35) {
  const colours = [primary, secondary];
  const body = guillocheRosette()
    .map((l) => `<path d="${l.d}" fill="none" stroke="${colours[l.tone]}" stroke-width="${width}"/>`)
    .join("");
  return doc("0 0 200 200", body);
}

// Field stretches to any box; non-scaling strokes keep lines hairline-thin at any size.
function field(color: string, lines: number, seed: number) {
  const d = guillocheField({ width: 600, height: 240, lines, amplitude: 10, waves: 2.5, seed });
  return doc(
    "0 -12 600 264",
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="0.6" vector-effect="non-scaling-stroke"/>`,
    ` preserveAspectRatio="none"`,
  );
}

// Band tile: repeat horizontally with background-repeat: repeat-x.
function band(color: string, width = 0.55) {
  const d = guillocheBand({ width: 120, height: 24, waves: 2, lines: 12 });
  return doc("0 0 120 24", `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"/>`, ` preserveAspectRatio="none"`);
}

export const ART = {
  "rosette-cobalt": () => rosette(cobalt, amber),
  "rosette-mono": () => rosette(cobalt, cobalt, 0.3),
  "rosette-white": () => rosette(white, amber, 0.4),
  "field-cobalt": () => field(cobalt, 44, 11),
  "field-white": () => field(white, 36, 3),
  "band-cobalt": () => band(cobalt),
  "band-amber": () => band(amber, 0.7),
  "band-red": () => band("#b3312a"),
} as const;

export type ArtName = keyof typeof ART;
export const artUrl = (name: ArtName) => `/art/${name}.svg`;
