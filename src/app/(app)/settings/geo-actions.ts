"use server";

import { type GeoOption, listDistricts, listSubdistricts } from "@/lib/etax/geo";

/** Reference data for the address pickers. Nothing here is private. */
export async function districtsOf(province: string): Promise<GeoOption[]> {
  return /^\d{2}$/.test(province) ? listDistricts(province) : [];
}

export async function subdistrictsOf(district: string): Promise<GeoOption[]> {
  return /^\d{4}$/.test(district) ? listSubdistricts(district) : [];
}
