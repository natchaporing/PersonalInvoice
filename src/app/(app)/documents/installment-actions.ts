"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { todayBangkok, totalsFor } from "@/lib/domain/documents";
import { formObject, type FormState, invalid, money, optText, reqText, submitted } from "@/lib/domain/forms";
import { commissionFigures, installmentLines, pctLabel, planProblems, splitAmount } from "@/lib/domain/installments";
import { requireUser } from "@/lib/supabase/server";
import { computeTotals, lineAmount } from "@/lib/thai/money";

type Supa = Awaited<ReturnType<typeof requireUser>>["supabase"];

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const refresh = (...ids: string[]) => {
  revalidatePath("/");
  revalidatePath("/documents");
  ids.forEach((id) => revalidatePath(`/documents/${id}`));
};

async function loadQuotation(supabase: Supa, id: string) {
  const { data } = await supabase.from("documents").select("*").eq("id", id).eq("doc_type", "quotation").maybeSingle();
  return data;
}

/* ------------------------------------------------------------------ plan */

/** Save or replace the installment plan of an issued quotation. Locked once an installment has a document. */
export async function saveInstallmentPlan(quotationId: string, rows: { label: string; pctBps: number }[]): Promise<FormState> {
  const { supabase } = await requireUser();
  const q = await loadQuotation(supabase, quotationId);
  if (!q || q.status === "draft" || q.status === "void") return { error: "Issue the quotation before planning installments." };
  const clean = rows.map((r) => ({ label: r.label.trim().slice(0, 120), pctBps: Math.round(r.pctBps) }));
  const problems = planProblems(clean);
  if (problems.length) return { error: problems.join(" ") };

  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("quotation_id", quotationId).neq("status", "void");
  if (count) return { error: "Installments already have invoices, so the plan can no longer change. Void those documents first." };

  const amounts = splitAmount(q.taxable, clean.map((r) => r.pctBps));
  const del = await supabase.from("installments").delete().eq("quotation_id", quotationId);
  if (del.error) return { error: del.error.message };
  const { error } = await supabase
    .from("installments")
    .insert(clean.map((r, i) => ({ quotation_id: quotationId, position: i + 1, label: r.label, pct_bps: r.pctBps, amount: amounts[i] })));
  if (error) return { error: error.message };
  refresh(quotationId);
  return { message: "Installment plan saved." };
}

export async function deleteInstallmentPlan(quotationId: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("quotation_id", quotationId).neq("status", "void");
  if (count) return { error: "Installments already have invoices. Void those documents first." };
  const { error } = await supabase.from("installments").delete().eq("quotation_id", quotationId);
  if (error) return { error: error.message };
  refresh(quotationId);
  return { message: "Installment plan removed." };
}

/* ------------------------------------------------------------------ documents */

/** Create the draft invoice for one installment, then open it. */
export async function createInstallmentInvoice(installmentId: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { data: inst } = await supabase.from("installments").select("*").eq("id", installmentId).maybeSingle();
  if (!inst) return { error: "Installment not found." };
  const q = await loadQuotation(supabase, inst.quotation_id);
  if (!q || q.status === "void") return { error: "The quotation is void or missing." };

  const { data: existing } = await supabase.from("documents").select("id").eq("installment_id", installmentId).eq("doc_type", "invoice").neq("status", "void").limit(1);
  if (existing?.length) redirect(`/documents/${existing[0].id}`);

  const [{ data: qLines }, { count: total }] = await Promise.all([
    supabase.from("document_lines").select("*").eq("document_id", q.id),
    supabase.from("installments").select("id", { count: "exact", head: true }).eq("quotation_id", q.id),
  ]);
  const groups = computeTotals({
    lines: (qLines ?? []).map((l) => ({ qtyMilli: l.qty_milli, unitPrice: l.unit_price, discount: l.discount, vatBps: l.vat_bps })),
    discount: q.discount,
    vatRegistered: true,
    vatBps: q.vat_bps,
    pricesIncludeVat: q.prices_include_vat,
  }).vatGroups;
  const parts = installmentLines(inst.amount, groups);
  const of = `${inst.position}/${total ?? inst.position}`;
  const lines = parts.map((p) => ({
    descriptionTh: `งวดที่ ${of} · ${inst.label.split("·")[0].trim()} ${pctLabel(inst.pct_bps)} ตามใบเสนอราคา ${q.number}${parts.length > 1 ? ` (VAT ${p.vatBps / 100}%)` : ""}`,
    descriptionEn: `Installment ${of} · ${(inst.label.split("·")[1] ?? inst.label).trim()} ${pctLabel(inst.pct_bps)} of quotation ${q.number}`,
    qtyMilli: 1000,
    unitPrice: p.amount,
    discount: 0,
    vatBps: p.vatBps,
  }));
  const t = totalsFor({ lines, discount: 0, pricesIncludeVat: false, whtBps: q.wht_bps }, q.vat_bps);
  const today = todayBangkok();

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      doc_type: "invoice",
      customer_id: q.customer_id,
      issue_date: today,
      due_date: addDays(today, 30),
      lang: q.lang,
      prices_include_vat: false,
      vat_bps: q.vat_bps,
      wht_bps: q.wht_bps,
      discount: 0,
      subtotal: t.subtotal,
      taxable: t.taxable,
      vat: t.vat,
      total: t.total,
      wht: t.wht,
      net_receivable: t.netReceivable,
      signer_id: q.signer_id,
      approver_id: q.approver_id,
      show_unit: false,
      show_product_code: false,
      quotation_id: q.id,
      installment_id: inst.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const ins = await supabase.from("document_lines").insert(
    lines.map((l, i) => ({
      document_id: doc.id,
      position: i + 1,
      description_th: l.descriptionTh,
      description_en: l.descriptionEn,
      qty_milli: l.qtyMilli,
      unit: "",
      unit_price: l.unitPrice,
      discount: 0,
      vat_bps: l.vatBps,
      amount: lineAmount(l),
    })),
  );
  if (ins.error) return { error: ins.error.message };
  refresh(q.id, doc.id);
  redirect(`/documents/${doc.id}`);
}

/** Draft receipt/tax invoice for an issued invoice: same lines and totals, dated today (the VAT tax point for services). */
export async function createReceiptFromInvoice(invoiceId: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { data: inv } = await supabase.from("documents").select("*").eq("id", invoiceId).eq("doc_type", "invoice").maybeSingle();
  if (!inv || (inv.status !== "issued" && inv.status !== "paid")) return { error: "Only an issued invoice can get a receipt/tax invoice." };

  const { data: existing } = await supabase.from("documents").select("id").eq("source_document_id", invoiceId).neq("status", "void").limit(1);
  if (existing?.length) redirect(`/documents/${existing[0].id}`);

  const { data: lines } = await supabase.from("document_lines").select("*").eq("document_id", invoiceId).order("position");
  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      doc_type: "receipt_tax_invoice",
      customer_id: inv.customer_id,
      issue_date: todayBangkok(),
      due_date: null,
      lang: inv.lang,
      prices_include_vat: inv.prices_include_vat,
      vat_bps: inv.vat_bps,
      wht_bps: inv.wht_bps,
      discount: inv.discount,
      subtotal: inv.subtotal,
      taxable: inv.taxable,
      vat: inv.vat,
      total: inv.total,
      wht: inv.wht,
      net_receivable: inv.net_receivable,
      notes: `ชำระตามใบแจ้งหนี้ ${inv.number} · Paid against invoice ${inv.number}`,
      signer_id: inv.signer_id,
      approver_id: inv.approver_id,
      show_unit: inv.show_unit,
      show_product_code: inv.show_product_code,
      quotation_id: inv.quotation_id,
      installment_id: inv.installment_id,
      source_document_id: inv.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  const ins = await supabase.from("document_lines").insert(
    (lines ?? []).map((l) => ({
      document_id: doc.id,
      position: l.position,
      description_th: l.description_th,
      description_en: l.description_en,
      qty_milli: l.qty_milli,
      unit: l.unit,
      unit_price: l.unit_price,
      discount: l.discount,
      vat_bps: l.vat_bps,
      product_code: l.product_code,
      amount: l.amount,
    })),
  );
  if (ins.error) return { error: ins.error.message };
  refresh(invoiceId, doc.id, ...(inv.quotation_id ? [inv.quotation_id] : []));
  redirect(`/documents/${doc.id}`);
}

/* ------------------------------------------------------------------ commission */

const Commission = z
  .object({
    payee_name: reqText("Payee", 200),
    payee_account: optText(200),
    basis: z.enum(["percent", "fixed"]),
    rate: z.preprocess((v) => (v === "" || v == null ? undefined : Number(String(v).replace(/,/g, ""))), z.number().positive("Rate must be more than 0").max(100).optional()),
    fixed: money("Amount").optional(),
    wht_bps: z.coerce.number().int().refine((v) => [0, 100, 200, 300, 500].includes(v), "Unsupported rate"),
    note: optText(500),
  })
  .superRefine((c, ctx) => {
    if (c.basis === "percent" && !c.rate) ctx.addIssue({ code: "custom", path: ["rate"], message: "Enter the commission rate" });
    if (c.basis === "fixed" && !c.fixed) ctx.addIssue({ code: "custom", path: ["fixed"], message: "Enter the commission amount" });
  });

/** Record commission owed on a quotation. Internal only: it never appears on any document. */
export async function addCommission(quotationId: string, _: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = Commission.safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues);
  const q = await loadQuotation(supabase, quotationId);
  if (!q || q.status === "void") return { error: "The quotation is void or missing.", values: submitted(form) };
  const c = parsed.data;
  const rateBps = c.basis === "percent" ? Math.round((c.rate ?? 0) * 100) : undefined;
  const f = commissionFigures({ basis: c.basis, rateBps, fixed: c.fixed, whtBps: c.wht_bps }, q.taxable);
  if (f.amount <= 0) return { error: "The commission works out to ฿0.", values: submitted(form) };
  const { error } = await supabase.from("commissions").insert({
    quotation_id: quotationId,
    payee_name: c.payee_name,
    payee_account: c.payee_account,
    basis: c.basis,
    rate_bps: rateBps ?? null,
    amount: f.amount,
    wht_bps: c.wht_bps,
    wht: f.wht,
    note: c.note,
  });
  if (error) return { error: error.message, values: submitted(form) };
  refresh(quotationId);
  return { message: "Commission recorded." };
}

const Paid = z.object({
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the transfer date"),
  paid_reference: optText(200),
});

export async function markCommissionPaid(commissionId: string, _: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = Paid.safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues);
  const { data, error } = await supabase.from("commissions").update(parsed.data).eq("id", commissionId).select("quotation_id").single();
  if (error) return { error: error.message };
  refresh(data.quotation_id);
  return { message: "Marked as transferred." };
}

export async function undoCommissionPaid(commissionId: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("commissions").update({ paid_on: null, paid_reference: null }).eq("id", commissionId).select("quotation_id").single();
  if (error) return { error: error.message };
  refresh(data.quotation_id);
  return { message: "Marked as not transferred." };
}

export async function deleteCommission(commissionId: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("commissions").delete().eq("id", commissionId).select("quotation_id").single();
  if (error) return { error: error.message };
  refresh(data.quotation_id);
  return { message: "Commission removed." };
}
