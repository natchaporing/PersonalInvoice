/** Thai bank account numbers are usually 10 digits, printed as xxx-x-xxxxx-x. Other lengths are grouped in fours. */
export function formatBankAccount(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4, 9)}-${d.slice(9)}`;
  return d.replace(/(\d{4})(?=\d)/g, "$1-");
}
