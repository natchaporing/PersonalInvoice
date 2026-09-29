// Placeholder data for UI development. Replaced by Supabase queries when the data layer lands.
import type { DocumentView } from "@/lib/document-view";
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
  { id: "c1", name: "บริษัท สยามดิจิทัล จำกัด", nameEn: "Siam Digital Co., Ltd.", taxId: "0105561000001", branch: "00000", juristic: true,
    address: "99/9 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110", addressEn: "99/9 Sukhumvit Rd., Khlong Toei, Bangkok 10110" },
  { id: "c2", name: "บริษัท กรุงเทพครีเอทีฟ จำกัด", nameEn: "Bangkok Creative Co., Ltd.", taxId: "0105562000002", branch: "00001", juristic: true,
    address: "12 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500", addressEn: "12 Silom Rd., Silom, Bang Rak, Bangkok 10500" },
  { id: "c3", name: "คุณสมชาย ใจดี", nameEn: "Somchai Jaidee", taxId: "1101700000003", branch: "00000", juristic: false,
    address: "45 ซอยลาดพร้าว 71 แขวงวังทองหลาง เขตวังทองหลาง กรุงเทพมหานคร 10310", addressEn: "45 Soi Ladprao 71, Wang Thonglang, Bangkok 10310" },
];

/** Placeholder seller. Replaced by the business profile from Supabase. */
export const sampleSeller = {
  nameTh: "ชื่อผู้ประกอบการ (ตัวอย่าง)", nameEn: "Your Business Name (sample)",
  addressTh: "1 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10000",
  addressEn: "1 Example Rd., Example, Bangkok 10000",
  taxId: "1234567890123", branchCode: "00000", phone: "02-000-0000", email: "billing@example.com",
  bank: {
    bankTh: "ธนาคารตัวอย่าง", bankEn: "Example Bank",
    branchTh: "สาขาตัวอย่าง", branchEn: "Example branch",
    accountName: "ชื่อผู้ประกอบการ (ตัวอย่าง)",
    accountNameEn: "Your Business Name (sample)",
    accountNumber: "0000000000",
    accountType: "savings" as const,
  },
};

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
/** Documents that ask the customer for money, and so show where to pay. */
export const isPayable = (type: DocType) => RECEIVABLE.includes(type);
/** Only documents that ask for payment can be overdue (not quotations, receipts or credit notes). */
export const isOverdue = (d: Pick<SampleDoc, "type" | "status" | "dueDate">, today = "2026-09-29") =>
  RECEIVABLE.includes(d.type) && d.status === "issued" && d.dueDate < today;


/** A realistic sample tax invoice used by the design mockup. */
export const sampleTaxInvoice: DocumentView = {
  type: "tax_invoice",
  status: "issued",
  number: "TX2026-0014",
  issueDate: "2026-09-24",
  dueDate: "2026-10-24",
  lang: "bilingual",
  seller: sampleSeller,
  buyer: {
    nameTh: sampleCustomers[0].name, nameEn: sampleCustomers[0].nameEn,
    addressTh: sampleCustomers[0].address, addressEn: sampleCustomers[0].addressEn,
    taxId: sampleCustomers[0].taxId, branchCode: sampleCustomers[0].branch,
  },
  lines: [
    { descriptionTh: "พัฒนาเว็บไซต์ (ขั้นตอนที่ 1)", descriptionEn: "Website development (phase 1)", qtyMilli: 1000, unit: "งาน", unitPrice: 4_000_000 },
    { descriptionTh: "ออกแบบ UI/UX", descriptionEn: "UI/UX design", qtyMilli: 20000, unit: "ชม.", unitPrice: 50_000 },
    { descriptionTh: "ค่าโฮสติ้งรายปี", descriptionEn: "Annual hosting", qtyMilli: 1000, unit: "ปี", unitPrice: 300_000 },
  ],
  discount: 0,
  vatBps: 700,
  pricesIncludeVat: false,
  whtBps: 300,
  notes: "ชำระภายใน 30 วันนับจากวันที่ในเอกสาร\nPayment due within 30 days of the document date.",
};
