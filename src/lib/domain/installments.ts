// Installment plans on quotations and the commission ledger. Pure functions; money in satang, rates in bps.
import { allocate, bpsOf, type Satang } from "@/lib/thai/money";

export interface PlanRow {
  label: string;
  pctBps: number; // 5000 = 50%
}

export const PLAN_PRESETS: { key: string; name: string; rows: PlanRow[] }[] = [
  { key: "50-50", name: "50 / 50", rows: [{ label: "มัดจำ · Deposit", pctBps: 5000 }, { label: "ส่งมอบงาน · On completion", pctBps: 5000 }] },
  { key: "30-70", name: "30 / 70", rows: [{ label: "มัดจำ · Deposit", pctBps: 3000 }, { label: "ส่งมอบงาน · On completion", pctBps: 7000 }] },
  {
    key: "30-40-30",
    name: "30 / 40 / 30",
    rows: [
      { label: "มัดจำ · Deposit", pctBps: 3000 },
      { label: "งานระหว่างทำ · Progress", pctBps: 4000 },
      { label: "ส่งมอบงาน · On completion", pctBps: 3000 },
    ],
  },
];

export const pctLabel = (bps: number) => `${(bps / 100).toFixed(2).replace(/\.?0+$/, "")}%`;

/** Problems with a plan, in plain language; empty when it can be saved. */
export function planProblems(rows: PlanRow[]): string[] {
  const out: string[] = [];
  if (rows.length < 2) out.push("A plan needs at least two installments.");
  if (rows.length > 12) out.push("A plan can have at most 12 installments.");
  if (rows.some((r) => !r.label.trim())) out.push("Every installment needs a label.");
  if (rows.some((r) => !Number.isInteger(r.pctBps) || r.pctBps <= 0)) out.push("Every installment needs a percentage above 0.");
  const sum = rows.reduce((s, r) => s + r.pctBps, 0);
  if (sum !== 10000) out.push(`Percentages add up to ${pctLabel(sum)}, not 100%.`);
  return out;
}

/**
 * Splits the quotation's amount before VAT by the plan's percentages. Each installment is rounded to the satang
 * and the last one takes the remainder, so the installments always add up to the quotation exactly.
 */
export function splitAmount(total: Satang, pctBps: number[]): Satang[] {
  const parts = pctBps.map((p) => Math.round((total * p) / 10000));
  parts[parts.length - 1] = total - parts.slice(0, -1).reduce((s, x) => s + x, 0);
  return parts;
}

/** Lines of an installment invoice: the installment amount split across the quotation's VAT rates. */
export function installmentLines(amount: Satang, vatGroups: { bps: number; taxable: Satang }[]): { vatBps: number; amount: Satang }[] {
  const groups = vatGroups.filter((g) => g.taxable > 0);
  if (groups.length === 0) return [{ vatBps: 700, amount }];
  const parts = allocate(amount, groups.map((g) => g.taxable));
  return groups.map((g, i) => ({ vatBps: g.bps, amount: parts[i] })).filter((l) => l.amount > 0);
}

export type InstallmentStage = "planned" | "invoiced" | "paid" | "receipted";

export interface LinkedDoc {
  id: string;
  doc_type: string;
  status: string;
  number: string | null;
  total: number;
  installment_id: string | null;
}

/** Where an installment stands: the live invoice and receipt/tax invoice linked to it, ignoring void ones. */
export function installmentStage(installmentId: string, docs: LinkedDoc[]) {
  const mine = docs.filter((d) => d.installment_id === installmentId && d.status !== "void");
  const invoice = mine.find((d) => d.doc_type === "invoice");
  const receipt = mine.find((d) => d.doc_type === "receipt_tax_invoice");
  const stage: InstallmentStage = receipt && receipt.status !== "draft" ? "receipted" : invoice?.status === "paid" ? "paid" : invoice ? "invoiced" : "planned";
  return { invoice, receipt, stage };
}

/* ------------------------------------------------------------------ commission */

export interface CommissionInput {
  basis: "percent" | "fixed";
  rateBps?: number;
  fixed?: Satang;
  whtBps: number;
}

/** Commission before withholding, the tax withheld when paying it, and the net amount to transfer. */
export function commissionFigures(input: CommissionInput, base: Satang) {
  const amount = input.basis === "percent" ? bpsOf(base, input.rateBps ?? 0) : input.fixed ?? 0;
  const wht = bpsOf(amount, input.whtBps);
  return { amount, wht, net: amount - wht };
}
