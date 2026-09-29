// Thai withholding-tax rates offered in forms (basis points of the pre-VAT amount).
export const WHT_OPTIONS = [
  { bps: 0, label: "None" },
  { bps: 100, label: "1% · transport" },
  { bps: 200, label: "2% · advertising" },
  { bps: 300, label: "3% · services" },
  { bps: 500, label: "5% · rent" },
] as const;

export const VAT_REGISTRATION_THRESHOLD = 180_000_000; // ฿1.8M in satang
