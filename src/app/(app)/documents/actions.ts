"use server";

import { getLocale } from "@/lib/i18n/server";
import { localizeState } from "@/lib/i18n/server-text";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDocumentBundle, getProfile, paidAmount } from "@/lib/data/documents";
import { generateEtaxPackage } from "@/lib/etax/generate";
import { customerSnapshot, DocumentInput, isAdjustment, isPayable, sellerSnapshot, signatorySnapshot, totalsFor } from "@/lib/domain/documents";
import { fieldErrors, type FormState, invalid, money, optText } from "@/lib/domain/forms";
import { generateSignedPdf } from "@/lib/pdf/generate";
import { requireUser } from "@/lib/supabase/server";
import { lineAmount } from "@/lib/thai/money";

const revalidateDocs = (id?: string) => {
  revalidatePath("/");
  revalidatePath("/documents");
  if (id) revalidatePath(`/documents/${id}`);
};

/** Create or update a draft. Totals are always recomputed here from the lines. */
async function saveDocumentImpl(id: string | null, raw: unknown): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = DocumentInput.safeParse(raw);
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const input = parsed.data;

  const profile = await getProfile(supabase, user.id);
  const vatBps = profile?.default_vat_bps ?? 700;
  const t = totalsFor(input, vatBps);

  if (isAdjustment(input.type) && input.refDocumentId) {
    const { data: ref } = await supabase.from("documents").select("status, doc_type").eq("id", input.refDocumentId).maybeSingle();
    if (!ref || ref.status === "draft" || ref.status === "void") return { error: "The original document must be issued and not void." };
  }

  const row = {
    doc_type: input.type,
    customer_id: input.customerId,
    issue_date: input.issueDate,
    due_date: input.dueDate ?? null,
    valid_until: input.validUntil ?? null,
    reply_by: input.replyBy ?? null,
    show_product_code: input.showProductCode,
    show_unit: input.showUnit,
    signer_id: input.signerId ?? null,
    approver_id: input.approverId ?? null,
    lang: input.lang,
    prices_include_vat: input.pricesIncludeVat,
    vat_bps: vatBps,
    wht_bps: input.whtBps,
    discount: t.discount,
    subtotal: t.subtotal,
    taxable: t.taxable,
    vat: t.vat,
    total: t.total,
    wht: t.wht,
    net_receivable: t.netReceivable,
    notes: input.notes ?? null,
    ref_document_id: isAdjustment(input.type) ? input.refDocumentId ?? null : null,
    reason: isAdjustment(input.type) ? input.reason ?? null : null,
  };

  let docId = id;
  if (docId) {
    const { error } = await supabase.from("documents").update(row).eq("id", docId).eq("status", "draft");
    if (error) return { error: error.message };
    const del = await supabase.from("document_lines").delete().eq("document_id", docId);
    if (del.error) return { error: del.error.message };
  } else {
    const { data, error } = await supabase.from("documents").insert(row).select("id").single();
    if (error) return { error: error.message };
    docId = data.id;
  }

  const lines = input.lines.map((l, i) => ({
    document_id: docId!,
    position: i + 1,
    description_th: l.descriptionTh,
    description_en: l.descriptionEn ?? null,
    qty_milli: l.qtyMilli,
    unit: l.unit,
    unit_price: l.unitPrice,
    product_code: l.productCode ?? null,
    discount: Math.min(l.discount, lineAmount(l)),
    vat_bps: l.vatBps,
    amount: lineAmount(l) - Math.min(l.discount, lineAmount(l)),
  }));
  const ins = await supabase.from("document_lines").insert(lines);
  if (ins.error) return { error: ins.error.message };

  revalidateDocs(docId!);
  redirect(`/documents/${docId}`);
}

async function deleteDraftImpl(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("documents").delete().eq("id", id).eq("status", "draft");
  if (error) return { error: error.message };
  revalidateDocs();
  redirect("/documents");
}

/** Assign the next number, freeze seller/buyer snapshots, then render and sign the PDF. */
async function issueDocumentImpl(id: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const bundle = await getDocumentBundle(supabase, id, user.id);
  if (!bundle) return { error: "Document not found." };
  const profile = await getProfile(supabase, user.id);
  if (!profile) return { error: "Complete your business profile in Settings before issuing." };
  if (!bundle.customer) return { error: "The customer for this document no longer exists." };

  // Freeze the signer and approver as they are now (name, title and signature image).
  const ids = [bundle.doc.signer_id, bundle.doc.approver_id].filter((x): x is string => !!x);
  const { data: people } = ids.length ? await supabase.from("signatories").select("*").in("id", ids) : { data: [] };
  const person = (sid: string | null) => {
    const row = people?.find((x) => x.id === sid);
    return row ? signatorySnapshot(row) : null;
  };
  const signers = { signer: person(bundle.doc.signer_id), approver: person(bundle.doc.approver_id) };

  const { error } = await supabase.rpc("issue_document", {
    p_document_id: id,
    p_seller: sellerSnapshot(profile) as never,
    p_customer: customerSnapshot(bundle.customer) as never,
    p_signers: signers as never,
  });
  if (error) return { error: error.message };

  const pdf = await generateSignedPdf(supabase, id, user.id).catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
  revalidateDocs(id);
  if ("error" in pdf) return { message: `Issued. The signed PDF could not be generated yet (${pdf.error}); use "Generate signed PDF" to retry.` };
  return { message: "Issued and signed." };
}

async function regeneratePdfImpl(id: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const pdf = await generateSignedPdf(supabase, id, user.id).catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));
  revalidateDocs(id);
  return "error" in pdf ? { error: pdf.error } : { message: "Signed PDF generated." };
}

/** Build the e-Tax package (XML + signed PDF/A-3) for an issued tax document. */
async function generateEtaxImpl(id: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const res = await generateEtaxPackage(supabase, id, user.id);
  revalidateDocs(id);
  if (!res.ok) return { error: res.problems.join(" ") };
  return {
    message: res.testCert
      ? "e-Tax package generated and signed with the TEST certificate. The Revenue Department will not accept it until you sign with a CA-issued certificate."
      : "e-Tax package generated.",
  };
}

/** Records how the original reached the buyer (paper or e-Tax Invoice by Email), or clears it. */
async function markDeliveredImpl(id: string, via: "paper" | "etax_email" | null): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("documents")
    .update({ delivered_via: via, delivered_at: via ? new Date().toISOString() : null })
    .eq("id", id)
    .in("status", ["issued", "paid"]);
  if (error) return { error: error.message };
  revalidateDocs(id);
  return {};
}

async function voidDocumentImpl(id: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const { data: payments } = await supabase.from("payments").select("amount").eq("document_id", id);
  if (payments?.length) return { error: "This document has payments recorded. Issue a credit note instead of voiding it." };
  const { error } = await supabase
    .from("documents")
    .update({ status: "void", voided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "issued");
  if (error) return { error: error.message };
  await supabase.from("audit_log").insert({ owner_id: user.id, document_id: id, action: "voided" });
  revalidateDocs(id);
  return { message: "Document voided. Its number stays used and it remains on record." };
}

const Payment = z.object({
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the payment date"),
  amount: money("Amount").refine((v) => v > 0, "Amount must be more than 0"),
  method: z.enum(["transfer", "cheque", "cash", "other"]),
  reference: optText(200),
});

const MAX_UPLOAD = 10 * 1024 * 1024;
const UPLOAD_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

async function uploadFile(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  ownerId: string,
  folder: string,
  file: FormDataEntryValue | null,
): Promise<{ path: string | null; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return { path: null };
  if (file.size > MAX_UPLOAD) return { path: null, error: "File is larger than 10 MB." };
  if (!UPLOAD_TYPES.includes(file.type)) return { path: null, error: "Upload a PDF, PNG, JPEG or WebP file." };
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${ownerId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
  return error ? { path: null, error: error.message } : { path };
}

async function recordPaymentImpl(documentId: string, _: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = Payment.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return invalid(form, parsed.error.issues);

  const { data: doc } = await supabase.from("documents").select("doc_type, status, net_receivable").eq("id", documentId).maybeSingle();
  if (!doc || !isPayable(doc.doc_type)) return { error: "Payments can only be recorded on invoices, tax invoices and debit notes." };

  const slip = await uploadFile(supabase, user.id, "slips", form.get("slip"));
  if (slip.error) return { error: slip.error };

  const { error } = await supabase.from("payments").insert({ document_id: documentId, ...parsed.data, slip_path: slip.path });
  if (error) return { error: error.message };

  const { data: all } = await supabase.from("payments").select("amount").eq("document_id", documentId);
  const paid = paidAmount(all ?? []);
  if (paid >= doc.net_receivable && doc.status === "issued") {
    await supabase.from("documents").update({ status: "paid" }).eq("id", documentId);
  }
  await supabase.from("audit_log").insert({ owner_id: user.id, document_id: documentId, action: "payment", detail: { amount: parsed.data.amount } });
  revalidateDocs(documentId);
  revalidatePath("/payments");
  return { message: paid >= doc.net_receivable ? "Payment recorded. The document is now paid." : "Payment recorded." };
}

const Certificate = z.object({
  certificate_no: optText(100),
  issued_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the certificate date"),
  income_amount: money("Income amount"),
  wht_amount: money("Tax withheld").refine((v) => v > 0, "Tax withheld must be more than 0"),
});

/** Record a 50 Tawi withholding-tax certificate received from the customer. */
async function addWhtCertificateImpl(documentId: string | null, _: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = Certificate.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return invalid(form, parsed.error.issues);
  const file = await uploadFile(supabase, user.id, "wht", form.get("file"));
  if (file.error) return { error: file.error };
  const { error } = await supabase.from("wht_certificates").insert({ document_id: documentId, ...parsed.data, file_path: file.path });
  if (error) return { error: error.message };
  if (documentId) revalidateDocs(documentId);
  revalidatePath("/payments");
  revalidatePath("/tax");
  return { message: "Withholding certificate saved." };
}

/** Short-lived link to a stored file the user owns. */
export async function fileLink(path: string): Promise<string | null> {
  const { supabase, user } = await requireUser();
  if (!path.startsWith(`${user.id}/`)) return null;
  const { data } = await supabase.storage.from("documents").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}

// Exported actions return their messages in the visitor's language (see i18n/server-text).
export async function saveDocument(...args: Parameters<typeof saveDocumentImpl>): Promise<FormState> {
  return localizeState(await saveDocumentImpl(...args), await getLocale());
}
export async function deleteDraft(...args: Parameters<typeof deleteDraftImpl>): Promise<FormState> {
  return localizeState(await deleteDraftImpl(...args), await getLocale());
}
export async function issueDocument(...args: Parameters<typeof issueDocumentImpl>): Promise<FormState> {
  return localizeState(await issueDocumentImpl(...args), await getLocale());
}
export async function regeneratePdf(...args: Parameters<typeof regeneratePdfImpl>): Promise<FormState> {
  return localizeState(await regeneratePdfImpl(...args), await getLocale());
}
export async function generateEtax(...args: Parameters<typeof generateEtaxImpl>): Promise<FormState> {
  return localizeState(await generateEtaxImpl(...args), await getLocale());
}
export async function markDelivered(...args: Parameters<typeof markDeliveredImpl>): Promise<FormState> {
  return localizeState(await markDeliveredImpl(...args), await getLocale());
}
export async function voidDocument(...args: Parameters<typeof voidDocumentImpl>): Promise<FormState> {
  return localizeState(await voidDocumentImpl(...args), await getLocale());
}
export async function recordPayment(...args: Parameters<typeof recordPaymentImpl>): Promise<FormState> {
  return localizeState(await recordPaymentImpl(...args), await getLocale());
}
export async function addWhtCertificate(...args: Parameters<typeof addWhtCertificateImpl>): Promise<FormState> {
  return localizeState(await addWhtCertificateImpl(...args), await getLocale());
}
