import type { EtaxInput } from "./xml";

/** A realistic document for tests and the validator. */
export const sampleEtaxInput: EtaxInput = {
  docType: "tax_invoice",
  number: "TX2026-0001",
  issueDate: "2026-09-30",
  createdAt: "2026-09-30T14:05:09",
  dueDate: "2026-10-30",
  seller: {
    nameTh: "สตูดิโอ ณัฐชา",
    taxId: "1101700123456",
    branchCode: "00000",
    email: "billing@example.com",
    address: { postcode: "10310", buildingNumber: "88", street: "ถนนพระราม 9", provinceCode: "10", districtCode: "1017", subdistrictCode: "101701" },
  },
  buyer: {
    nameTh: "บริษัท สยามดิจิทัล จำกัด",
    taxId: "0105561000001",
    branchCode: "00000",
    isJuristic: true,
    email: "ap@example.com",
    addressText: "99/9 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110",
    postcode: "10110",
  },
  lines: [
    { code: "WEB-01", nameTh: "พัฒนาเว็บไซต์ & <ระบบ>", qtyMilli: 1000, unitPrice: 4_000_000, discount: 400_000, vatBps: 700 },
    { nameTh: "ออกแบบ UI/UX", qtyMilli: 20_000, unitPrice: 50_000, discount: 0, vatBps: 700 },
    { nameTh: "โดเมนเนม", qtyMilli: 1000, unitPrice: 100_000, discount: 0, vatBps: 0 },
  ],
  discount: 100_000,
  vatBps: 700,
  pricesIncludeVat: false,
  notes: "ชำระภายใน 30 วัน\nขอบคุณครับ",
};

export const sampleAdjustmentInput = (docType: "credit_note" | "debit_note"): EtaxInput => ({
  ...sampleEtaxInput,
  docType,
  number: docType === "credit_note" ? "CN2026-0001" : "DN2026-0001",
  lines: [{ nameTh: "ส่วนลดหลังการส่งมอบ", qtyMilli: 1000, unitPrice: 500_000, discount: 0, vatBps: 700 }],
  discount: 0,
  notes: undefined,
  adjustment: { reason: "ปรับราคาตามที่ตกลงกัน", original: { number: "TX2026-0001", issueDate: "2026-09-30", docType: "tax_invoice", taxable: 5_400_000 } },
});
