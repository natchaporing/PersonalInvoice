// Placeholder data for UI development. Replaced by Supabase queries when the data layer lands.
import type { Satang } from "@/lib/thai/money";

export type DocStatus = "draft" | "issued" | "paid" | "void";
export type DocType = "quotation" | "invoice" | "tax_invoice" | "receipt_tax_invoice" | "credit_note" | "debit_note";

export const DOC_TYPE_LABEL: Record<DocType, { en: string; th: string }> = {
  quotation: { en: "Quotation", th: "ใบเสนอราคา" },
  invoice: { en: "Invoice", th: "ใบแจ้งหนี้" },
  tax_invoice: { en: "Tax invoice", th: "ใบกำกับภาษี" },
  receipt_tax_invoice: { en: "Receipt / tax invoice", th: "ใบเสร็จรับเงิน/ใบกำกับภาษี" },
  credit_note: { en: "Credit note", th: "ใบลดหนี้" },
  debit_note: { en: "Debit note", th: "ใบเพิ่มหนี้" },
};

export interface SampleDoc {
  id: string; number: string; type: DocType; status: DocStatus;
  customer: string; issueDate: string; dueDate: string; total: Satang; net: Satang;
}

export const sampleCustomers = [
  { id: "c1", name: "บริษัท สยามดิจิทัล จำกัด", nameEn: "Siam Digital Co., Ltd.", taxId: "0105561000001", juristic: true },
  { id: "c2", name: "บริษัท กรุงเทพครีเอทีฟ จำกัด", nameEn: "Bangkok Creative Co., Ltd.", taxId: "0105562000002", juristic: true },
  { id: "c3", name: "คุณสมชาย ใจดี", nameEn: "Somchai Jaidee", taxId: "1101700000003", juristic: false },
];

export const sampleDocs: SampleDoc[] = [
  { id: "d1", number: "TX2026-0014", type: "tax_invoice", status: "issued", customer: "บริษัท สยามดิจิทัล จำกัด", issueDate: "2026-09-24", dueDate: "2026-10-24", total: 5_350_000, net: 5_200_000 },
  { id: "d2", number: "TX2026-0013", type: "tax_invoice", status: "issued", customer: "บริษัท กรุงเทพครีเอทีฟ จำกัด", issueDate: "2026-08-30", dueDate: "2026-09-14", total: 2_140_000, net: 2_080_000 },
  { id: "d3", number: "RTX2026-0009", type: "receipt_tax_invoice", status: "paid", customer: "คุณสมชาย ใจดี", issueDate: "2026-09-12", dueDate: "2026-09-12", total: 1_070_000, net: 1_040_000 },
  { id: "d4", number: "QT2026-0004", type: "quotation", status: "issued", customer: "บริษัท สยามดิจิทัล จำกัด", issueDate: "2026-09-27", dueDate: "2026-10-11", total: 8_560_000, net: 8_560_000 },
  { id: "d5", number: "CN2026-0001", type: "credit_note", status: "issued", customer: "บริษัท กรุงเทพครีเอทีฟ จำกัด", issueDate: "2026-09-05", dueDate: "2026-09-05", total: 214_000, net: 214_000 },
  { id: "d6", number: "—", type: "invoice", status: "draft", customer: "บริษัท สยามดิจิทัล จำกัด", issueDate: "2026-09-29", dueDate: "2026-10-29", total: 3_210_000, net: 3_210_000 },
];

export const sampleStats = {
  outstanding: 7_490_000,
  overdue: 2_140_000,
  monthRevenue: 6_420_000,
  monthVat: 420_000,
  yearRevenue: 128_400_000, // ytd, pre-VAT
  vatThreshold: 180_000_000,
};

const RECEIVABLE: DocType[] = ["invoice", "tax_invoice", "debit_note"];
/** Only documents that ask for payment can be overdue (not quotations, receipts or credit notes). */
export const isOverdue = (d: Pick<SampleDoc, "type" | "status" | "dueDate">, today = "2026-09-29") =>
  RECEIVABLE.includes(d.type) && d.status === "issued" && d.dueDate < today;
