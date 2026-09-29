// All money is integer satang (1 THB = 100 satang). Rates are basis points (700 = 7%).

export type Satang = number;

/** Integer division rounded half away from zero. */
export function roundDiv(numerator: number, denominator: number): number {
  if (denominator === 0) throw new Error("Division by zero");
  const sign = numerator < 0 !== denominator < 0 ? -1 : 1;
  const n = Math.abs(numerator);
  const d = Math.abs(denominator);
  return sign * Math.floor((2 * n + d) / (2 * d));
}

export const bpsOf = (amount: Satang, bps: number): Satang => roundDiv(amount * bps, 10000);

export const thbToSatang = (thb: number): Satang => Math.round(thb * 100);

export const formatTHB = (satang: Satang, locale: "th-TH" | "en-US" = "en-US"): string =>
  (satang / 100).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface LineInput {
  /** Quantity in thousandths (1000 = 1 unit). */
  qtyMilli: number;
  unitPrice: Satang;
}

export interface TotalsInput {
  lines: LineInput[];
  /** Discount on the whole document, in satang. */
  discount?: Satang;
  vatRegistered: boolean;
  vatBps?: number; // default 700
  /** true: line prices already include VAT. */
  pricesIncludeVat?: boolean;
  /** Withholding tax the customer will deduct, in bps of the pre-VAT amount (e.g. 300 = 3%). */
  whtBps?: number;
}

export interface Totals {
  subtotal: Satang;
  discount: Satang;
  /** Amount before VAT (VAT base and WHT base). */
  taxable: Satang;
  vat: Satang;
  total: Satang;
  wht: Satang;
  /** total − wht: what actually arrives in the bank. */
  netReceivable: Satang;
}

export const lineAmount = (l: LineInput): Satang => roundDiv(l.qtyMilli * l.unitPrice, 1000);

export function computeTotals(input: TotalsInput): Totals {
  const vatBps = input.vatBps ?? 700;
  const subtotal = input.lines.reduce((s, l) => s + lineAmount(l), 0);
  const discount = input.discount ?? 0;
  if (discount < 0 || discount > subtotal) throw new Error("Invalid discount");
  const afterDiscount = subtotal - discount;

  let taxable: Satang;
  let vat: Satang;
  let total: Satang;
  if (!input.vatRegistered) {
    taxable = afterDiscount;
    vat = 0;
    total = afterDiscount;
  } else if (input.pricesIncludeVat) {
    total = afterDiscount;
    taxable = roundDiv(total * 10000, 10000 + vatBps);
    vat = total - taxable;
  } else {
    taxable = afterDiscount;
    vat = bpsOf(taxable, vatBps);
    total = taxable + vat;
  }
  const wht = bpsOf(taxable, input.whtBps ?? 0);
  return { subtotal, discount, taxable, vat, total, wht, netReceivable: total - wht };
}
