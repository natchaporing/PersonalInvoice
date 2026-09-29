import { describe, expect, it } from "vitest";
import { pp30Deadlines, receivables, type ReportDoc, salesTaxReport, toCsv, vatSummary } from "./reports";

const doc = (p: Partial<ReportDoc>): ReportDoc => ({
  id: p.id ?? Math.random().toString(36),
  doc_type: "tax_invoice",
  status: "issued",
  number: "TX2026-0001",
  issue_date: "2026-09-10",
  due_date: null,
  taxable: 100_000,
  vat: 7_000,
  total: 107_000,
  net_receivable: 104_000,
  ...p,
});

describe("vatSummary", () => {
  it("adds tax invoices and debit notes, subtracts credit notes, ignores drafts, void and non-tax docs", () => {
    const docs = [
      doc({}),
      doc({ doc_type: "receipt_tax_invoice", taxable: 50_000, vat: 3_500 }),
      doc({ doc_type: "debit_note", taxable: 10_000, vat: 700 }),
      doc({ doc_type: "credit_note", taxable: 20_000, vat: 1_400 }),
      doc({ status: "draft" }),
      doc({ status: "void" }),
      doc({ doc_type: "invoice" }),
      doc({ doc_type: "quotation" }),
      doc({ status: "paid", taxable: 1_000, vat: 70 }),
    ];
    expect(vatSummary(docs, () => true)).toEqual({ sales: 141_000, vat: 9_870, documents: 5 });
  });
});

describe("receivables", () => {
  it("counts only issued payable docs, net of payments, and flags overdue", () => {
    const a = doc({ id: "a", due_date: "2026-09-01", net_receivable: 104_000 });
    const b = doc({ id: "b", due_date: "2026-10-30", net_receivable: 50_000 });
    const c = doc({ id: "c", status: "paid" });
    const d = doc({ id: "d", doc_type: "receipt_tax_invoice" });
    const paid = new Map([["a", 4_000]]);
    expect(receivables([a, b, c, d], paid, "2026-09-29")).toEqual({ outstanding: 150_000, overdue: 100_000, openCount: 2, overdueCount: 1 });
  });
});

describe("salesTaxReport", () => {
  it("lists the month's tax documents in date order with credit notes negative", () => {
    const rows = salesTaxReport(
      [
        doc({ number: "TX2026-0002", issue_date: "2026-09-20", customer_snapshot: { name_th: "ก", tax_id: "0105561000001", branch_code: "00000" } }),
        doc({ number: "CN2026-0001", doc_type: "credit_note", issue_date: "2026-09-21", taxable: 5_000, vat: 350 }),
        doc({ number: "TX2026-0001", issue_date: "2026-09-02" }),
        doc({ number: "TX2026-0003", issue_date: "2026-10-01" }),
      ],
      "2026-09",
    );
    expect(rows.map((r) => r.number)).toEqual(["TX2026-0001", "TX2026-0002", "CN2026-0001"]);
    expect(rows[1]).toMatchObject({ buyerName: "ก", buyerTaxId: "0105561000001", taxable: 100_000 });
    expect(rows[2]).toMatchObject({ taxable: -5_000, vat: -350 });
  });
});

describe("toCsv / pp30Deadlines", () => {
  it("quotes where needed and starts with a BOM", () => {
    expect(toCsv([["a", 'b "c"', "d,e"], [1, 2, 3]])).toBe('﻿a,"b ""c""","d,e"\r\n1,2,3\r\n');
  });
  it("rolls over the year for December", () => {
    expect(pp30Deadlines("2026-09")).toEqual({ paper: "2026-10-15", efiling: "2026-10-23" });
    expect(pp30Deadlines("2026-12")).toEqual({ paper: "2027-01-15", efiling: "2027-01-23" });
  });
});
