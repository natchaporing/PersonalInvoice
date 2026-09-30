// Light colour palettes. The CSS tokens for each live in globals.css under [data-palette="<key>"].
// Colours here are only for the picker's swatches and must match those tokens.
export const PALETTES = [
  { key: "cobalt", label: "Cobalt", th: "โคบอลต์", note: "Current: banknote blue with amber and gold", swatch: ["#0047ab", "#003580", "#ffb854"] },
  { key: "jade", label: "Jade", th: "เขียวหยก", note: "Inspired by the 20-baht note: deep green, saffron accents", swatch: ["#066044", "#04432f", "#f5b544"] },
  { key: "amethyst", label: "Amethyst", th: "ม่วงอเมทิสต์", note: "Inspired by the 500-baht note: royal purple, amber accents", swatch: ["#5b3a9a", "#3f2570", "#ffb854"] },
  { key: "bronze", label: "Bronze", th: "สัมฤทธิ์", note: "Warm bronze on ivory paper, with teal accents", swatch: ["#6f420f", "#4d2c06", "#6cc4b9"] },
] as const;

export type PaletteKey = (typeof PALETTES)[number]["key"];
export const DEFAULT_PALETTE: PaletteKey = "cobalt";
export const PALETTE_COOKIE = "palette";
export const isPalette = (v: string | undefined): v is PaletteKey => PALETTES.some((p) => p.key === v);
