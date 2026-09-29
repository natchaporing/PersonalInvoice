// Pure reporting over document rows: dashboard figures, monthly VAT (PP30) and the sales tax report.
import { type DocStatus, type DocType, isPayable } from "./documents";

export interface ReportDoc {
  id: string;
  doc_type: DocType;
  status: DocStatus;
  number: string | null;
  issue_date: string; // YYYY-MM-DD
  due_date: string | null;
  taxable: number;
  vat: number;
  total: number;
  net_receivable: number;
  customer_snapshot?: unknown;
}

/** Sign of a document in output-VAT terms: tax invoices and debit notes add, credit notes subtract, others don't count. */
export function vatSign(d: Pick<ReportDoc, "doc_type" | "status">): 1 | -1 | 0 {
  if (d.status === "draft" || d.status === "void") return 0;
  if (d.doc_type === "tax_invoice" || d.doc_type === "receipt_tax_invoice" || d.doc_type === "debit_note") return 1;
  if (d.doc_type === "credit_note") return -1;
  return 0;
}

export const monthOf = (iso: string) => iso.slice(0, 7); // YYYY-MM

export interface VatSummary {
  sales: number; // taxable value, net of credit notes
  vat: number; // output VAT, net of credit notes
  documents: number;
}

export function vatSummary(docs: ReportDoc[], filter: (d: ReportDoc) => boolean): VatSummary {
  let sales = 0, vat = 0, documents = 0;
  for (const d of docs) {
    const s = vatSign(d);
    if (!s || !filter(d)) continue;
    sales += s * d.taxable;
    vat += s * d.vat;
    documents++;
  }
  return { sales, vat, documents };
}

export interface Receivables {
  outstanding: number;
  overdue: number;
  openCount: number;
  overdueCount: number;
}

/** Money still owed on issued payable documents, net of payments received. */
export function receivables(docs: ReportDoc[], paidByDoc: Map<string, number>, today: string): Receivables {
  const r: Receivables = { outstanding: 0, overdue: 0, openCount: 0, overdueCount: 0 };
  for (const d of docs) {
    if (!isPayable(d.doc_type) || d.status !== "issued") continue;
    const due = Math.max(0, d.net_receivable - (paidByDoc.get(d.id) ?? 0));
    if (!due) continue;
    r.outstanding += due;
    r.openCount++;
    if (d.due_date && d.due_date < today) {
      r.overdue += due;
      r.overdueCount++;
    }
  }
  return r;
}

export interface SalesTaxRow {
  date: string;
  number: string;
  type: DocType;
  buyerName: string;
  buyerTaxId: string;
  buyerBranch: string;
  taxable: number; // signed
  vat: number; // signed
}

/** รายงานภาษีขาย: every tax document in the month, credit notes negative. */
export function salesTaxReport(docs: ReportDoc[], month: string): SalesTaxRow[] {
  return docs
    .filter((d) => vatSign(d) !== 0 && monthOf(d.issue_date) === month)
    .sort((a, b) => a.issue_date.localeCompare(b.issue_date) || (a.number ?? "").localeCompare(b.number ?? ""))
    .map((d) => {
      const s = vatSign(d);
      const c = (d.customer_snapshot ?? {}) as { name_th?: string; tax_id?: string; branch_code?: string };
      return {
        date: d.issue_date,
        number: d.number ?? "",
        type: d.doc_type,
        buyerName: c.name_th ?? "",
        buyerTaxId: c.tax_id ?? "",
        buyerBranch: c.branch_code ?? "",
        taxable: s * d.taxable,
        vat: s * d.vat,
      };
    });
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel shows Thai correctly. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** PP30 deadline for a month's return: 15th of the next month on paper, 23rd if e-filed. */
export function pp30Deadlines(month: string): { paper: string; efiling: string } {
  const [y, m] = month.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const mm = String(nm).padStart(2, "0");
  return { paper: `${ny}-${mm}-15`, efiling: `${ny}-${mm}-23` };
}
