import type { Enums } from "@/lib/supabase/database.types";

type DocType = Enums<"document_type">;
type DocStatus = Enums<"document_status">;

export type Lang = "th" | "en" | "bilingual";

export interface Party {
  nameTh: string;
  nameEn?: string;
  addressTh?: string;
  addressEn?: string;
  taxId?: string;
  branchCode: string;
  phone?: string;
  email?: string;
}

/** Where the customer transfers money. Comes from the business profile. */
export interface BankAccount {
  bankTh: string;
  bankEn?: string;
  branchTh?: string;
  branchEn?: string;
  accountName: string;
  accountNameEn?: string;
  /** Digits only; formatted for display. */
  accountNumber: string;
  accountType?: "savings" | "current";
}

export interface DocLine {
  descriptionTh: string;
  descriptionEn?: string;
  qtyMilli: number;
  unit: string;
  unitPrice: number; // satang
}

/** Everything needed to render a document. Totals are always derived, never stored here. */
export interface DocumentView {
  type: DocType;
  status: DocStatus;
  number?: string;
  issueDate: string;
  dueDate?: string;
  lang: Lang;
  seller: Party & { bank?: BankAccount };
  buyer: Party;
  lines: DocLine[];
  discount: number; // satang
  vatBps: number;
  pricesIncludeVat: boolean;
  whtBps: number;
  notes?: string;
  /** Credit/debit notes: why the original was adjusted. */
  reason?: string;
  /** Credit/debit notes: number of the original document. */
  refNumber?: string;
  /** Public verification code of an issued document. */
  verifyCode?: string;
  copy?: "original" | "copy";
}
