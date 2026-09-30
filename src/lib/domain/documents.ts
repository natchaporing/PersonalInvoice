// Document rules and mapping between database rows and the renderable DocumentView.
import { z } from "zod";
import type { BankAccount, DocLine, DocumentView, Lang, Party, Signatory } from "@/lib/document-view";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { computeTotals, lineAmount, lineNet, type Totals } from "@/lib/thai/money";

export type DocType = Tables<"documents">["doc_type"];
export type DocStatus = Tables<"documents">["status"];

export const DOC_TYPES: DocType[] = ["quotation", "invoice", "tax_invoice", "receipt_tax_invoice", "credit_note", "debit_note"];

export const DOC_TYPE_LABEL: Record<DocType, { en: string; th: string }> = {
  quotation: { en: "Quotation", th: "ใบเสนอราคา" },
  invoice: { en: "Invoice", th: "ใบแจ้งหนี้" },
  tax_invoice: { en: "Tax invoice", th: "ใบกำกับภาษี" },
  receipt_tax_invoice: { en: "Receipt / tax invoice", th: "ใบเสร็จรับเงิน/ใบกำกับภาษี" },
  credit_note: { en: "Credit note", th: "ใบลดหนี้" },
  debit_note: { en: "Debit note", th: "ใบเพิ่มหนี้" },
};

const PAYABLE: DocType[] = ["invoice", "tax_invoice", "debit_note"];
/** Documents that ask the customer for money: they show bank details, take payments and can be overdue. */
export const isPayable = (t: DocType) => PAYABLE.includes(t);
/** Documents that are tax documents under Revenue Code s.86 (count towards output VAT). */
export const isTaxDocument = (t: DocType) => t === "tax_invoice" || t === "receipt_tax_invoice" || t === "credit_note" || t === "debit_note";
/** Credit/debit notes must reference an original document and give a reason. */
export const isAdjustment = (t: DocType) => t === "credit_note" || t === "debit_note";

export const isOverdue = (d: { doc_type: DocType; status: DocStatus; due_date: string | null }, today: string) =>
  isPayable(d.doc_type) && d.status === "issued" && !!d.due_date && d.due_date < today;

/** Today in Thailand (UTC+7), as YYYY-MM-DD. */
export function todayBangkok(now = new Date()): string {
  return new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ snapshots */

export interface SellerSnapshot {
  name_th: string;
  name_en?: string | null;
  address_th: string;
  address_en?: string | null;
  tax_id: string;
  branch_code: string;
  phone?: string | null;
  email?: string | null;
  bank?: BankAccount | null;
}

export interface CustomerSnapshot {
  name_th: string;
  name_en?: string | null;
  address_th?: string | null;
  address_en?: string | null;
  tax_id?: string | null;
  branch_code: string;
  is_juristic: boolean;
}

export function sellerSnapshot(p: Tables<"business_profiles">): SellerSnapshot {
  const bank: BankAccount | null =
    p.bank_name_th && p.bank_account_number && p.bank_account_name
      ? {
          bankTh: p.bank_name_th,
          bankEn: p.bank_name_en ?? undefined,
          branchTh: p.bank_branch_th ?? undefined,
          branchEn: p.bank_branch_en ?? undefined,
          accountName: p.bank_account_name,
          accountNameEn: p.bank_account_name_en ?? undefined,
          accountNumber: p.bank_account_number,
          accountType: p.bank_account_type === "current" ? "current" : p.bank_account_type === "savings" ? "savings" : undefined,
        }
      : null;
  return {
    name_th: p.name_th, name_en: p.name_en, address_th: p.address_th, address_en: p.address_en,
    tax_id: p.tax_id, branch_code: p.branch_code, phone: p.phone, email: p.email, bank,
  };
}

export function customerSnapshot(c: Tables<"customers">): CustomerSnapshot {
  return {
    name_th: c.name_th, name_en: c.name_en, address_th: c.address_th, address_en: c.address_en,
    tax_id: c.tax_id, branch_code: c.branch_code, is_juristic: c.is_juristic,
  };
}

const asObj = <T>(j: Json | null): T | null => (j && typeof j === "object" && !Array.isArray(j) ? (j as unknown as T) : null);

function sellerParty(s: SellerSnapshot): Party & { bank?: BankAccount } {
  return {
    nameTh: s.name_th, nameEn: s.name_en ?? undefined, addressTh: s.address_th, addressEn: s.address_en ?? undefined,
    taxId: s.tax_id, branchCode: s.branch_code, phone: s.phone ?? undefined, email: s.email ?? undefined, bank: s.bank ?? undefined,
  };
}

function buyerParty(c: CustomerSnapshot): Party {
  return {
    nameTh: c.name_th, nameEn: c.name_en ?? undefined, addressTh: c.address_th ?? undefined, addressEn: c.address_en ?? undefined,
    taxId: c.tax_id ?? undefined, branchCode: c.branch_code,
  };
}

/** A signer or approver frozen onto the document at issue time. */
export interface SignatorySnapshot {
  name_th: string;
  name_en?: string | null;
  title_th?: string | null;
  title_en?: string | null;
  signature_image?: string | null;
}

export interface SignersSnapshot {
  signer?: SignatorySnapshot | null;
  approver?: SignatorySnapshot | null;
}

export const signatorySnapshot = (s: Tables<"signatories">): SignatorySnapshot => ({
  name_th: s.name_th, name_en: s.name_en, title_th: s.title_th, title_en: s.title_en, signature_image: s.signature_image,
});

const signatoryView = (s: SignatorySnapshot | null | undefined): Signatory | undefined =>
  s ? { nameTh: s.name_th, nameEn: s.name_en ?? undefined, titleTh: s.title_th ?? undefined, titleEn: s.title_en ?? undefined, signatureImage: s.signature_image ?? undefined } : undefined;

export const EMPTY_SELLER: SellerSnapshot = { name_th: "—", address_th: "", tax_id: "", branch_code: "00000" };
export const EMPTY_CUSTOMER: CustomerSnapshot = { name_th: "—", branch_code: "00000", is_juristic: true };

/**
 * Renderable view of a stored document. Issued documents use their frozen snapshots;
 * drafts use the live profile and customer passed in.
 */
export function toDocumentView(
  doc: Tables<"documents">,
  lines: Tables<"document_lines">[],
  live: { seller?: SellerSnapshot | null; customer?: CustomerSnapshot | null; signers?: SignersSnapshot | null } = {},
): DocumentView {
  const seller = asObj<SellerSnapshot>(doc.seller_snapshot) ?? live.seller ?? EMPTY_SELLER;
  const customer = asObj<CustomerSnapshot>(doc.customer_snapshot) ?? live.customer ?? EMPTY_CUSTOMER;
  const signers = asObj<SignersSnapshot>(doc.signers_snapshot) ?? live.signers ?? null;
  return {
    type: doc.doc_type,
    status: doc.status,
    number: doc.number ?? undefined,
    issueDate: doc.issue_date,
    dueDate: doc.due_date ?? undefined,
    validUntil: doc.valid_until ?? undefined,
    replyBy: doc.reply_by ?? undefined,
    showProductCode: doc.show_product_code,
    showUnit: doc.show_unit,
    signer: signatoryView(signers?.signer),
    approver: signatoryView(signers?.approver),
    lang: doc.lang as Lang,
    seller: sellerParty(seller),
    buyer: buyerParty(customer),
    lines: [...lines].sort((a, b) => a.position - b.position).map<DocLine>((l) => ({
      descriptionTh: l.description_th, descriptionEn: l.description_en ?? undefined,
      code: l.product_code ?? undefined,
      qtyMilli: l.qty_milli, unit: l.unit, unitPrice: l.unit_price, discount: l.discount, vatBps: l.vat_bps,
    })),
    discount: doc.discount,
    vatBps: doc.vat_bps,
    pricesIncludeVat: doc.prices_include_vat,
    whtBps: doc.wht_bps,
    notes: doc.notes ?? undefined,
    reason: doc.reason ?? undefined,
    verifyCode: doc.verify_code ?? undefined,
  };
}

/* ------------------------------------------------------------------ editor input */

const satang = z.number().int().min(0).max(1_000_000_000_000);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optDate = isoDate.optional().or(z.literal("").transform(() => undefined));
const optId = z.string().uuid().optional().or(z.literal("").transform(() => undefined));

export const VAT_RATE_OPTIONS = [700, 0] as const;

export const LineInput = z.object({
  productCode: z.string().trim().max(60).optional().transform((v) => v || undefined),
  discount: satang.default(0),
  vatBps: z.number().int().refine((v) => (VAT_RATE_OPTIONS as readonly number[]).includes(v), "Unsupported VAT rate"),
  descriptionTh: z.string().trim().min(1, "Each line needs a Thai description").max(500),
  descriptionEn: z.string().trim().max(500).optional().transform((v) => v || undefined),
  qtyMilli: z.number().int().positive("Quantity must be more than 0").max(1_000_000_000),
  unit: z.string().trim().max(30).default(""),
  unitPrice: satang,
});

export const DocumentInput = z
  .object({
    type: z.enum(DOC_TYPES as [DocType, ...DocType[]]),
    customerId: z.string().uuid("Choose a customer"),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dueDate: optDate,
    validUntil: optDate,
    replyBy: optDate,
    showProductCode: z.boolean(),
    showUnit: z.boolean(),
    signerId: optId,
    approverId: optId,
    lang: z.enum(["th", "en", "bilingual"]),
    pricesIncludeVat: z.boolean(),
    whtBps: z.number().int().refine((v) => [0, 100, 200, 300, 500].includes(v), "Unsupported withholding rate"),
    discount: satang,
    notes: z.string().trim().max(2000).optional().transform((v) => v || undefined),
    refDocumentId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
    reason: z.string().trim().max(500).optional().transform((v) => v || undefined),
    lines: z.array(LineInput).min(1, "Add at least one line").max(100),
  })
  .superRefine((d, ctx) => {
    if (d.dueDate && d.dueDate < d.issueDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date is before the issue date" });
    if (d.validUntil && d.validUntil < d.issueDate) ctx.addIssue({ code: "custom", path: ["validUntil"], message: "Valid-until date is before the issue date" });
    if (d.replyBy && d.replyBy < d.issueDate) ctx.addIssue({ code: "custom", path: ["replyBy"], message: "Reply-by date is before the issue date" });
    d.lines.forEach((l, i) => {
      if (l.discount > lineAmount(l)) ctx.addIssue({ code: "custom", path: ["lines", i, "discount"], message: "Discount is more than the line amount" });
    });
    if (isAdjustment(d.type)) {
      if (!d.refDocumentId) ctx.addIssue({ code: "custom", path: ["refDocumentId"], message: "Choose the original document" });
      if (!d.reason) ctx.addIssue({ code: "custom", path: ["reason"], message: "Give the reason for the adjustment" });
    }
  });
export type DocumentInput = z.infer<typeof DocumentInput>;

/** Server-side totals: the only totals ever stored. */
export function totalsFor(
  input: {
    lines: { qtyMilli: number; unitPrice: number; discount?: number; vatBps?: number }[];
    discount: number;
    pricesIncludeVat: boolean;
    whtBps: number;
  },
  vatBps: number,
): Totals {
  const subtotal = input.lines.reduce((s, l) => s + lineNet({ ...l, discount: Math.min(l.discount ?? 0, lineAmount(l)) }), 0);
  return computeTotals({
    lines: input.lines.map((l) => ({ ...l, discount: Math.min(l.discount ?? 0, lineAmount(l)) })),
    discount: Math.min(input.discount, subtotal),
    vatRegistered: true,
    vatBps,
    pricesIncludeVat: input.pricesIncludeVat,
    whtBps: input.whtBps,
  });
}
