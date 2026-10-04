import type { DocType } from "@/lib/domain/documents";

/** ETDA's time-stamp service for e-Tax Invoice by Email: the seller copies every e-Tax email to this address. */
export const ETAX_EMAIL_CC = "csemail@etax.teda.th";
/** One document per email, attachment at most 3 MB. */
export const ETAX_EMAIL_MAX_BYTES = 3 * 1024 * 1024;

const CODE: Partial<Record<DocType, string>> = { tax_invoice: "INV", receipt_tax_invoice: "INV", credit_note: "CRN", debit_note: "DBN" };

export const isEtaxEmailType = (t: DocType) => t in CODE;

/**
 * Subject line the time-stamp service reads: [issue date][type][number], plus [original number] for credit and
 * debit notes. Brackets with no spaces between them. Date as YYYYMMDD.
 */
export function etaxEmailSubject(d: { docType: DocType; issueDate: string; number: string; refNumber?: string | null }) {
  const code = CODE[d.docType];
  if (!code) throw new Error(`${d.docType} is not sent by e-Tax Invoice by Email`);
  const parts = [d.issueDate.replaceAll("-", ""), code, d.number];
  if (code !== "INV" && d.refNumber) parts.push(d.refNumber);
  return parts.map((p) => `[${p}]`).join("");
}

/** A mailto: link with the buyer in To, the time-stamp service in CC and the subject filled in. */
export function etaxMailto(to: string | null | undefined, subject: string, body: string) {
  const q = new URLSearchParams({ cc: ETAX_EMAIL_CC, subject, body });
  return `mailto:${encodeURIComponent(to ?? "")}?${q.toString().replace(/\+/g, "%20")}`;
}
