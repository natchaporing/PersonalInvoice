// Thai for the messages that document and installment actions (and the document schema) return in English.
// The English text is the key, so English output is untouched; anything not listed passes through as is.
import type { FormState } from "@/lib/domain/forms";
import type { Locale } from "./config";

const TH: Record<string, string> = {
  "Please fix the highlighted fields.": "กรุณาแก้ไขช่องที่ไฮไลต์",
  "The original document must be issued and not void.": "เอกสารต้นฉบับต้องออกแล้วและไม่ถูกยกเลิก",
  "Document not found.": "ไม่พบเอกสาร",
  "Complete your business profile in Settings before issuing.": "กรอกข้อมูลกิจการในหน้าตั้งค่าก่อนออกเอกสาร",
  "The customer for this document no longer exists.": "ไม่พบลูกค้าของเอกสารนี้แล้ว",
  "Issued and signed.": "ออกเอกสารและลงลายมือชื่อแล้ว",
  "Signed PDF generated.": "สร้าง PDF ลงลายมือชื่อแล้ว",
  "This document has payments recorded. Issue a credit note instead of voiding it.": "เอกสารนี้มีการบันทึกรับชำระแล้ว ให้ออกใบลดหนี้แทนการยกเลิก",
  "Document voided. Its number stays used and it remains on record.": "ยกเลิกเอกสารแล้ว เลขที่ถูกใช้ไปแล้วและเอกสารยังเก็บไว้ในระบบ",
  "Choose the payment date": "เลือกวันที่รับเงิน",
  "Amount must be more than 0": "จำนวนเงินต้องมากกว่า 0",
  "File is larger than 10 MB.": "ไฟล์ใหญ่เกิน 10 MB",
  "Upload a PDF, PNG, JPEG or WebP file.": "อัปโหลดไฟล์ PDF, PNG, JPEG หรือ WebP",
  "Payments can only be recorded on invoices, tax invoices and debit notes.": "บันทึกรับชำระได้เฉพาะใบแจ้งหนี้ ใบกำกับภาษี และใบเพิ่มหนี้",
  "Payment recorded.": "บันทึกการรับชำระแล้ว",
  "Payment recorded. The document is now paid.": "บันทึกการรับชำระแล้ว เอกสารนี้ชำระครบแล้ว",
  "Choose the certificate date": "เลือกวันที่ในหนังสือรับรอง",
  "Tax withheld must be more than 0": "ภาษีที่หักต้องมากกว่า 0",
  "Withholding certificate saved.": "บันทึกหนังสือรับรองแล้ว",
  "Issue the quotation before planning installments.": "ออกใบเสนอราคาก่อนวางแผนแบ่งงวด",
  "Installments already have invoices, so the plan can no longer change. Void those documents first.":
    "บางงวดออกใบแจ้งหนี้แล้ว จึงเปลี่ยนแผนไม่ได้ ยกเลิกเอกสารเหล่านั้นก่อน",
  "Installment plan saved.": "บันทึกแผนแบ่งงวดแล้ว",
  "Installments already have invoices. Void those documents first.": "บางงวดออกใบแจ้งหนี้แล้ว ยกเลิกเอกสารเหล่านั้นก่อน",
  "Installment plan removed.": "ลบแผนแบ่งงวดแล้ว",
  "Installment not found.": "ไม่พบงวดนี้",
  "The quotation is void or missing.": "ใบเสนอราคาถูกยกเลิกหรือไม่พบ",
  "Only an issued invoice can get a receipt/tax invoice.": "ออกใบเสร็จรับเงิน/ใบกำกับภาษีได้เฉพาะใบแจ้งหนี้ที่ออกแล้ว",
  "Rate must be more than 0": "อัตราต้องมากกว่า 0",
  "Unsupported rate": "อัตราไม่รองรับ",
  "Enter the commission rate": "กรอกอัตราค่านายหน้า",
  "Enter the commission amount": "กรอกจำนวนค่านายหน้า",
  "That payee no longer exists.": "ไม่พบผู้รับรายนี้แล้ว",
  "The commission works out to ฿0.": "ค่านายหน้าคำนวณได้ ฿0",
  "Commission recorded.": "บันทึกค่านายหน้าแล้ว",
  "Choose the transfer date": "เลือกวันที่โอน",
  "Marked as transferred.": "บันทึกว่าโอนแล้ว",
  "Marked as not transferred.": "บันทึกว่ายังไม่โอน",
  "Commission removed.": "ลบค่านายหน้าแล้ว",
  "Unsupported VAT rate": "อัตรา VAT ไม่รองรับ",
  "Each line needs a Thai description": "ทุกรายการต้องมีรายละเอียดภาษาไทย",
  "Quantity must be more than 0": "จำนวนต้องมากกว่า 0",
  "Choose a customer": "เลือกลูกค้า",
  "Unsupported withholding rate": "อัตราหัก ณ ที่จ่ายไม่รองรับ",
  "Add at least one line": "เพิ่มอย่างน้อยหนึ่งรายการ",
  "Due date is before the issue date": "วันครบกำหนดอยู่ก่อนวันที่ออก",
  "Valid-until date is before the issue date": "วันยืนราคาอยู่ก่อนวันที่ออก",
  "Reply-by date is before the issue date": "วันตอบรับอยู่ก่อนวันที่ออก",
  "Discount is more than the line amount": "ส่วนลดมากกว่ายอดของรายการ",
  "Choose the original document": "เลือกเอกสารต้นฉบับ",
  "Give the reason for the adjustment": "ระบุเหตุผลของการปรับปรุง",
  "A plan needs at least two installments.": "แผนต้องมีอย่างน้อย 2 งวด",
  "A plan can have at most 12 installments.": "แผนมีได้ไม่เกิน 12 งวด",
  "Every installment needs a label.": "ทุกงวดต้องมีชื่อ",
  "Every installment needs a percentage above 0.": "ทุกงวดต้องมีเปอร์เซ็นต์มากกว่า 0",
};

// Labels used inside the generic "X is required / must be a number / cannot be negative" messages.
const LABELS: Record<string, string> = {
  Amount: "จำนวนเงิน",
  "Income amount": "เงินได้",
  "Tax withheld": "ภาษีที่หัก",
  Payee: "ผู้รับ",
};
const label = (l: string) => LABELS[l] ?? l;

const PATTERNS: [RegExp, (...m: string[]) => string][] = [
  [/^Issued\. The signed PDF could not be generated yet \(([\s\S]*)\); use "Generate signed PDF" to retry\.$/, (e) => `ออกเอกสารแล้ว แต่ยังสร้าง PDF ลงลายมือชื่อไม่ได้ (${e}) กด "สร้าง PDF ลงลายมือชื่อ" เพื่อลองอีกครั้ง`],
  [/^Percentages add up to (.+), not 100%\.$/, (p) => `เปอร์เซ็นต์รวมได้ ${p} ไม่ใช่ 100%`],
  [/^(.+) is required$/, (l) => `กรุณากรอก${label(l)}`],
  [/^(.+) must be a number$/, (l) => `${label(l)}ต้องเป็นตัวเลข`],
  [/^(.+) cannot be negative$/, (l) => `${label(l)}ติดลบไม่ได้`],
];

/** One message in the UI language. */
export function translateServerText(text: string, locale: Locale): string {
  if (locale !== "th") return text;
  if (TH[text]) return TH[text];
  for (const [re, fn] of PATTERNS) {
    const m = re.exec(text);
    if (m) return fn(...m.slice(1));
  }
  return text;
}

/** A whole action result in the UI language: error, message and every field error. */
export function localizeState<T extends FormState | void>(state: T, locale: Locale): T {
  if (!state || locale !== "th") return state;
  const s = state as FormState;
  const t = (x?: string) => (x === undefined ? x : translateServerText(x, locale));
  return {
    ...s,
    error: t(s.error),
    message: t(s.message),
    fieldErrors: s.fieldErrors && Object.fromEntries(Object.entries(s.fieldErrors).map(([k, v]) => [k, translateServerText(v, locale)])),
  } as T;
}
