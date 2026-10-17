// Service agreements (สัญญาจ้าง) made from a quotation. Pure functions: the default clauses, the tokens they use,
// stamp duty, and the canonical text the content hash is taken over.
import type { Satang } from "@/lib/thai/money";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";

export type ContractStatus = "draft" | "sent" | "signed" | "void";

export interface Clause {
  /** "scope" is followed by the quotation's lines; "payment" by the payment schedule. */
  kind?: "scope" | "payment";
  title_th: string;
  title_en: string;
  body_th: string;
  body_en: string;
}

export interface ContractFacts {
  quotationNumber: string;
  quotationDate: string;
  lines: { descriptionTh: string; descriptionEn?: string; qty: string; unit: string; amount: Satang }[];
  taxable: Satang;
  vat: Satang;
  total: Satang;
  whtBps: number;
  schedule: { label: string; pctBps: number; amount: Satang }[];
}

export interface ContractDates {
  start?: string | null;
  end?: string | null;
}

/** Stamp duty on a hire-of-work agreement: 1 baht for every 1,000 baht of the fee or part of it. */
export const stampDuty = (fee: Satang): Satang => Math.ceil(fee / 100_000) * 100;

const baht = (s: Satang) => formatTHB(s);

/** Fills {{tokens}} in a clause with the contract's own figures and dates. Unknown tokens stay as they are. */
export function fillTokens(text: string, f: ContractFacts, d: ContractDates, lang: "th" | "en") {
  const date = (iso?: string | null) => (iso ? (lang === "th" ? formatDateTH(iso) : formatDateEN(iso)) : lang === "th" ? "(ยังไม่ระบุ)" : "(to be agreed)");
  const values: Record<string, string> = {
    quotation: f.quotationNumber,
    quotationDate: date(f.quotationDate),
    start: date(d.start),
    end: date(d.end),
    price: baht(f.taxable),
    vat: baht(f.vat),
    total: baht(f.total),
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => values[k] ?? m);
}

/** The standard agreement: scope, term, payment, acceptance, revisions, IP, confidentiality, termination, liability, law. */
export function defaultClauses(f: ContractFacts): Clause[] {
  const wht = f.whtBps > 0;
  return [
    {
      kind: "scope",
      title_th: "ขอบเขตงาน",
      title_en: "Scope of work",
      body_th: "ผู้ว่าจ้างตกลงจ้าง และผู้รับจ้างตกลงรับจ้างทำงานตามรายการด้านล่าง ตามใบเสนอราคาเลขที่ {{quotation}} ลงวันที่ {{quotationDate}} ซึ่งให้ถือเป็นส่วนหนึ่งของสัญญานี้",
      body_en: "The Client engages the Contractor, and the Contractor agrees, to carry out the work listed below, as set out in quotation {{quotation}} dated {{quotationDate}}, which forms part of this agreement.",
    },
    {
      title_th: "ระยะเวลา",
      title_en: "Term",
      body_th: "ผู้รับจ้างจะเริ่มงานในวันที่ {{start}} และส่งมอบงานให้แล้วเสร็จภายในวันที่ {{end}} หากผู้ว่าจ้างส่งข้อมูลหรือแจ้งความเห็นล่าช้า กำหนดส่งมอบจะเลื่อนออกไปเท่ากับระยะเวลาที่ล่าช้านั้น",
      body_en: "The Contractor starts on {{start}} and delivers the work by {{end}}. Any delay by the Client in providing information or feedback extends the delivery date by the same time.",
    },
    {
      kind: "payment",
      title_th: "ค่าจ้างและการชำระเงิน",
      title_en: "Fee and payment",
      body_th:
        "ค่าจ้างตามสัญญานี้เป็นเงิน {{price}} บาท ภาษีมูลค่าเพิ่ม {{vat}} บาท รวมเป็นเงินทั้งสิ้น {{total}} บาท ผู้ว่าจ้างจะชำระตามงวดด้านล่างภายใน 7 วันนับจากวันที่ได้รับใบแจ้งหนี้ ผู้รับจ้างจะออกใบเสร็จรับเงิน/ใบกำกับภาษีเมื่อได้รับชำระแต่ละงวด" +
        (wht ? " หากผู้ว่าจ้างหักภาษี ณ ที่จ่าย ผู้ว่าจ้างจะส่งหนังสือรับรองการหักภาษี ณ ที่จ่ายให้ผู้รับจ้าง" : ""),
      body_en:
        "The fee is {{price}} baht plus VAT of {{vat}} baht, {{total}} baht in total. The Client pays each instalment below within 7 days of receiving the invoice, and the Contractor issues a receipt/tax invoice for each payment." +
        (wht ? " Where the Client withholds tax, it gives the Contractor the withholding tax certificate." : ""),
    },
    {
      title_th: "การส่งมอบและการตรวจรับ",
      title_en: "Delivery and acceptance",
      body_th: "ผู้ว่าจ้างจะตรวจรับงานภายใน 7 วันนับจากวันที่ได้รับมอบงาน หากไม่แจ้งข้อบกพร่องเป็นลายลักษณ์อักษรภายในกำหนด ให้ถือว่าผู้ว่าจ้างได้ตรวจรับงานแล้ว",
      body_en: "The Client reviews the work within 7 days of delivery. If the Client gives no written notice of defects within that time, the work is deemed accepted.",
    },
    {
      title_th: "การแก้ไขงาน",
      title_en: "Revisions",
      body_th: "ค่าจ้างรวมการแก้ไขงานไม่เกิน 2 ครั้ง การแก้ไขเพิ่มเติมหรืองานนอกขอบเขตให้ตกลงค่าใช้จ่ายและระยะเวลากันเป็นลายลักษณ์อักษรก่อนเริ่มทำ",
      body_en: "The fee includes up to two rounds of revisions. Further revisions or work outside the scope are agreed in writing, with their cost and timing, before they start.",
    },
    {
      title_th: "ทรัพย์สินทางปัญญา",
      title_en: "Intellectual property",
      body_th: "ลิขสิทธิ์และทรัพย์สินทางปัญญาในงานที่ส่งมอบตกเป็นของผู้ว่าจ้างเมื่อผู้ว่าจ้างชำระค่าจ้างครบถ้วนแล้ว ผู้รับจ้างอาจนำงานไปแสดงเป็นตัวอย่างผลงานได้ เว้นแต่ผู้ว่าจ้างแจ้งไม่อนุญาตเป็นลายลักษณ์อักษร",
      body_en: "Copyright and other intellectual property in the delivered work pass to the Client once the fee is paid in full. The Contractor may show the work in its portfolio unless the Client objects in writing.",
    },
    {
      title_th: "การรักษาความลับ",
      title_en: "Confidentiality",
      body_th: "คู่สัญญาจะเก็บรักษาข้อมูลที่ได้รับจากอีกฝ่ายไว้เป็นความลับ และจะไม่เปิดเผยต่อบุคคลอื่นโดยไม่ได้รับความยินยอม เว้นแต่กฎหมายกำหนดให้เปิดเผย",
      body_en: "Each party keeps the other's information confidential and does not disclose it without consent, unless the law requires it.",
    },
    {
      title_th: "การบอกเลิกสัญญา",
      title_en: "Termination",
      body_th: "คู่สัญญาฝ่ายใดฝ่ายหนึ่งอาจบอกเลิกสัญญาได้โดยแจ้งเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 15 วัน ผู้ว่าจ้างจะชำระค่าจ้างสำหรับงานที่ทำไปแล้วจนถึงวันเลิกสัญญา และเงินที่ชำระแล้วไม่ต้องคืน เว้นแต่ตกลงกันเป็นอย่างอื่น",
      body_en: "Either party may end this agreement with at least 15 days' written notice. The Client pays for the work done up to the end date, and amounts already paid are not refunded unless agreed otherwise.",
    },
    {
      title_th: "ความรับผิด",
      title_en: "Liability",
      body_th: "ความรับผิดของผู้รับจ้างตามสัญญานี้รวมกันไม่เกินค่าจ้างตามสัญญา เว้นแต่ความเสียหายเกิดจากการกระทำโดยจงใจหรือประมาทเลินเล่ออย่างร้ายแรง",
      body_en: "The Contractor's total liability under this agreement is limited to the fee, except for damage caused intentionally or by gross negligence.",
    },
    {
      title_th: "กฎหมายที่ใช้บังคับและการลงนาม",
      title_en: "Governing law and signature",
      body_th:
        "สัญญานี้อยู่ภายใต้กฎหมายไทย คู่สัญญาอาจลงลายมือชื่อบนกระดาษหรือลงลายมือชื่ออิเล็กทรอนิกส์ ซึ่งมีผลตามพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544 คู่สัญญาได้อ่านและเข้าใจข้อความในสัญญานี้โดยตลอดแล้ว จึงลงลายมือชื่อไว้เป็นสำคัญ",
      body_en:
        "This agreement is governed by Thai law. The parties may sign on paper or electronically; an electronic signature has effect under the Electronic Transactions Act B.E. 2544. The parties have read and understood this agreement and sign it below.",
    },
  ];
}

/** The text that is frozen and hashed when a contract is sent: everything the client agrees to. */
export function contractCanonical(c: {
  number: string;
  lang: string;
  contract_date: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  clauses: unknown;
  facts: unknown;
  seller_snapshot: unknown;
  client_snapshot: unknown;
  owner_signer: unknown;
}) {
  const sort = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sort(x)])) : v;
  return JSON.stringify(
    sort({
      number: c.number, lang: c.lang, contract_date: c.contract_date, place: c.place, start_date: c.start_date, end_date: c.end_date,
      clauses: c.clauses, facts: c.facts, seller: c.seller_snapshot, client: c.client_snapshot, owner_signer: c.owner_signer,
    }),
  );
}

/** Contract number from its quotation: QT2026-0007 → CT2026-0007, then -2, -3 for later versions. */
export const contractNumber = (quotationNumber: string, existing: number) =>
  `${quotationNumber.replace(/^QT/, "CT")}${existing > 0 ? `-${existing + 1}` : ""}`;
