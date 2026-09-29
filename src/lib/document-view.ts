import type { DocStatus, DocType } from "@/lib/sample-data";

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
  seller: Party & { promptPayId?: string };
  buyer: Party;
  lines: DocLine[];
  discount: number; // satang
  vatBps: number;
  pricesIncludeVat: boolean;
  whtBps: number;
  notes?: string;
  copy?: "original" | "copy";
}
