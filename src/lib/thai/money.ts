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
  /** Discount on this line, in satang (taken off qty × price). */
  discount?: Satang;
  /** VAT rate of this line in bps; defaults to the document rate. 0 = zero-rated or exempt. */
  vatBps?: number;
}

export interface TotalsInput {
  lines: LineInput[];
  /** Discount on the whole document, in satang. Shared across lines in proportion to their value. */
  discount?: Satang;
  vatRegistered: boolean;
  vatBps?: number; // default 700; used by lines without their own rate
  /** true: line prices already include VAT. */
  pricesIncludeVat?: boolean;
  /** Withholding tax the customer will deduct, in bps of the pre-VAT amount (e.g. 300 = 3%). */
  whtBps?: number;
}

export interface VatGroup {
  bps: number;
  /** Amount before VAT at this rate. */
  taxable: Satang;
  vat: Satang;
}

export interface Totals {
  /** Sum of line amounts after line discounts. */
  subtotal: Satang;
  /** Sum of the per-line discounts (already taken off the subtotal). */
  lineDiscount: Satang;
  /** Discount on the whole document. */
  discount: Satang;
  /** Amount before VAT (VAT base and WHT base). */
  taxable: Satang;
  vat: Satang;
  total: Satang;
  wht: Satang;
  /** total − wht: what actually arrives in the bank. */
  netReceivable: Satang;
  /** Taxable amount and VAT per rate, highest rate first. */
  vatGroups: VatGroup[];
}

/** qty × unit price, before any discount. */
export const lineAmount = (l: LineInput): Satang => roundDiv(l.qtyMilli * l.unitPrice, 1000);

/** Line amount after its own discount. */
export const lineNet = (l: LineInput): Satang => lineAmount(l) - (l.discount ?? 0);

/** Split `total` over `weights` in proportion, using largest remainders so the parts add up exactly. */
export function allocate(total: Satang, weights: number[]): Satang[] {
  const sum = weights.reduce((s, w) => s + w, 0);
  if (total === 0 || sum === 0) return weights.map(() => 0);
  const shares = weights.map((w) => (total * w) / sum);
  const parts = shares.map(Math.floor);
  let left = total - parts.reduce((s, p) => s + p, 0);
  const order = shares.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    parts[i] += 1;
    left -= 1;
  }
  return parts;
}

export function computeTotals(input: TotalsInput): Totals {
  const docVatBps = input.vatBps ?? 700;
  let lineDiscount = 0;
  const nets = input.lines.map((l) => {
    const d = l.discount ?? 0;
    if (d < 0 || d > lineAmount(l)) throw new Error("Invalid line discount");
    lineDiscount += d;
    return lineNet(l);
  });
  const subtotal = nets.reduce((s, n) => s + n, 0);
  const discount = input.discount ?? 0;
  if (discount < 0 || discount > subtotal) throw new Error("Invalid discount");

  // Each line carries its share of the document discount, then lines are grouped by VAT rate.
  const shares = allocate(discount, nets);
  const byRate = new Map<number, number>();
  input.lines.forEach((l, i) => {
    const bps = input.vatRegistered ? (l.vatBps ?? docVatBps) : 0;
    byRate.set(bps, (byRate.get(bps) ?? 0) + nets[i] - shares[i]);
  });

  const vatGroups: VatGroup[] = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([bps, amount]) => {
      if (bps === 0) return { bps, taxable: amount, vat: 0 };
      if (input.pricesIncludeVat) {
        const taxable = roundDiv(amount * 10000, 10000 + bps);
        return { bps, taxable, vat: amount - taxable };
      }
      return { bps, taxable: amount, vat: bpsOf(amount, bps) };
    });

  const taxable = vatGroups.reduce((s, g) => s + g.taxable, 0);
  const vat = vatGroups.reduce((s, g) => s + g.vat, 0);
  const total = taxable + vat;
  const wht = bpsOf(taxable, input.whtBps ?? 0);
  return { subtotal, lineDiscount, discount, taxable, vat, total, wht, netReceivable: total - wht, vatGroups };
}
