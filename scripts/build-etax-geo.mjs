// Builds src/lib/etax/geo-data.json (province, district, sub-district codes and Thai names) from the official
// ETDA code lists, so the seller address can carry the codes the e-Tax XML requires.
// Run: node scripts/build-etax-geo.mjs
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../vendor/etda-etax/ETDA/codelist/standard/", import.meta.url);
function codes(file) {
  const xml = readFileSync(new URL(file, dir), "utf8");
  const out = [];
  for (const m of xml.matchAll(/<xsd:enumeration value="(\d+)">\s*<xsd:annotation>\s*<xsd:documentation[^>]*><ccts:Name>([^<]*)<\/ccts:Name>/g)) out.push([m[1], m[2].trim()]);
  return out;
}
const provinces = codes("ThaiISOCountrySubdivisionCode_1p0.xsd");
const districtList = codes("TISICityName_1p0.xsd");
const subList = codes("TISICitySubDivisionName_1p0.xsd");

const districts = {};
for (const [c, n] of districtList) (districts[c.slice(0, 2)] ??= []).push([c, n]);
const subdistricts = {};
for (const [c, n] of subList) (subdistricts[c.slice(0, 4)] ??= []).push([c, n]);

writeFileSync(new URL("../src/lib/etax/geo-data.json", import.meta.url), JSON.stringify({ provinces, districts, subdistricts }));
console.log(`provinces ${provinces.length}, districts ${districtList.length}, sub-districts ${subList.length}`);
