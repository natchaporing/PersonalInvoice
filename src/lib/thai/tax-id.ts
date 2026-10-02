/**
 * Thai 13-digit tax IDs. Individuals use their national ID number; juristic persons (companies) have IDs that
 * start with 0. The last digit is a checksum over the first 12.
 */
export function taxIdChecksumOk(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(id[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(id[12]);
}

/** A company's (juristic person's) tax ID. */
export const isJuristicTaxId = (id: string) => /^0\d{12}$/.test(id);
