// Sample tax invoice for the design mockup at /preview/tax-invoice. Not used by real documents.
import type { DocumentView } from "@/lib/document-view";

export const sampleTaxInvoice: DocumentView = {
  type: "tax_invoice",
  status: "issued",
  number: "TX2026-0014",
  issueDate: "2026-09-24",
  dueDate: "2026-10-24",
  showProductCode: true,
  showUnit: true,
  lang: "bilingual",
  seller: {
    nameTh: "ชื่อผู้ประกอบการ (ตัวอย่าง)", nameEn: "Your Business Name (sample)",
    addressTh: "1 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10000",
    addressEn: "1 Example Rd., Example, Bangkok 10000",
    taxId: "1234567890123", branchCode: "00000", phone: "02-000-0000", email: "billing@example.com",
    bank: {
      bankTh: "ธนาคารตัวอย่าง", bankEn: "Example Bank",
      branchTh: "สาขาตัวอย่าง", branchEn: "Example branch",
      accountName: "ชื่อผู้ประกอบการ (ตัวอย่าง)", accountNameEn: "Your Business Name (sample)",
      accountNumber: "0000000000", accountType: "savings",
    },
  },
  buyer: {
    nameTh: "บริษัท สยามดิจิทัล จำกัด", nameEn: "Siam Digital Co., Ltd.",
    addressTh: "99/9 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
    addressEn: "99/9 Sukhumvit Rd., Khlong Toei, Bangkok 10110",
    taxId: "0105561000001", branchCode: "00000",
  },
  lines: [
    { descriptionTh: "พัฒนาเว็บไซต์ (ขั้นตอนที่ 1)", descriptionEn: "Website development (phase 1)", qtyMilli: 1000, unit: "งาน", unitPrice: 4_000_000, discount: 0, vatBps: 700, code: "WEB-01" },
    { descriptionTh: "ออกแบบ UI/UX", descriptionEn: "UI/UX design", qtyMilli: 20000, unit: "ชม.", unitPrice: 50_000, discount: 50_000, vatBps: 700, code: "DSN-02" },
    { descriptionTh: "ค่าโฮสติ้งรายปี", descriptionEn: "Annual hosting", qtyMilli: 1000, unit: "ปี", unitPrice: 300_000, discount: 0, vatBps: 700, code: "HST-03" },
  ],
  discount: 0,
  vatBps: 700,
  pricesIncludeVat: false,
  whtBps: 300,
  notes: "ชำระภายใน 30 วันนับจากวันที่ในเอกสาร\nPayment due within 30 days of the document date.",
  verifyCode: "sample0000000000",
};
