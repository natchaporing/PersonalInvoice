import data from "./geo-data.json";

// Province, district and sub-district codes with Thai names, from the official ETDA code lists
// (see scripts/build-etax-geo.mjs). Server-side only: it is a few hundred KB.

export type GeoOption = { code: string; name: string };

const opt = ([code, name]: string[]): GeoOption => ({ code, name: name.replace(/\*$/, "") });
const table = data as { provinces: string[][]; districts: Record<string, string[][]>; subdistricts: Record<string, string[][]> };

export const listProvinces = (): GeoOption[] => table.provinces.map(opt);
export const listDistricts = (province: string): GeoOption[] => (table.districts[province] ?? []).map(opt);
export const listSubdistricts = (district: string): GeoOption[] => (table.subdistricts[district] ?? []).map(opt);

/** True when the three codes exist and nest correctly (2 → 4 → 6 digits). */
export function isValidGeo(province: string, district: string, subdistrict: string): boolean {
  return (
    district.startsWith(province) &&
    subdistrict.startsWith(district) &&
    listProvinces().some((p) => p.code === province) &&
    listDistricts(province).some((d) => d.code === district) &&
    listSubdistricts(district).some((s) => s.code === subdistrict)
  );
}
