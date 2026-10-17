"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { contractHash, newSignToken } from "@/lib/data/contracts";
import { getDocumentBundle } from "@/lib/data/documents";
import { type ContractFacts, contractNumber, defaultClauses } from "@/lib/domain/contracts";
import { signatorySnapshot } from "@/lib/domain/documents";
import type { FormState } from "@/lib/domain/forms";
import { getMessages } from "@/lib/i18n/server";
import type { Json } from "@/lib/supabase/database.types";
import { requireUser } from "@/lib/supabase/server";
import { lineNet } from "@/lib/thai/money";

const refresh = (id?: string) => {
  revalidatePath("/contracts");
  if (id) revalidatePath(`/contracts/${id}`);
};

/** A draft service agreement from an issued quotation: parties, lines, amounts and payment plan, standard clauses. */
export async function createContract(quotationId: string): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const m = await getMessages();
  const bundle = await getDocumentBundle(supabase, quotationId, user.id);
  const q = bundle?.doc;
  if (!bundle || !q || q.doc_type !== "quotation" || !q.number || (q.status !== "issued" && q.status !== "paid")) return { error: m.contracts.errQuotation };

  const { data: plan } = await supabase.from("installments").select("label, pct_bps, amount").eq("quotation_id", quotationId).order("position");
  const qty = (milli: number) => (milli % 1000 === 0 ? String(milli / 1000) : (milli / 1000).toFixed(3).replace(/0+$/, ""));
  const facts: ContractFacts = {
    quotationNumber: q.number,
    quotationDate: q.issue_date,
    lines: bundle.lines.map((l) => ({
      descriptionTh: l.description_th,
      descriptionEn: l.description_en ?? undefined,
      qty: qty(l.qty_milli),
      unit: l.unit,
      amount: lineNet({ qtyMilli: l.qty_milli, unitPrice: l.unit_price, discount: l.discount, vatBps: l.vat_bps }),
    })),
    taxable: q.taxable,
    vat: q.vat,
    total: q.total,
    whtBps: q.wht_bps,
    schedule: (plan ?? []).map((r) => ({ label: r.label, pctBps: r.pct_bps, amount: r.amount })),
  };
  const { count } = await supabase.from("contracts").select("id", { count: "exact", head: true }).eq("quotation_id", quotationId);
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      quotation_id: quotationId,
      number: contractNumber(q.number, count ?? 0),
      lang: q.lang,
      facts: facts as unknown as Json,
      clauses: defaultClauses(facts) as unknown as Json,
      seller_snapshot: q.seller_snapshot as Json,
      client_snapshot: q.customer_snapshot as Json,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  refresh();
  redirect(`/contracts/${data.id}`);
}

const Clause = z.object({
  kind: z.enum(["scope", "payment"]).optional(),
  title_th: z.string().trim().min(1).max(200),
  title_en: z.string().trim().max(200),
  body_th: z.string().trim().min(1).max(5000),
  body_en: z.string().trim().max(5000),
});
const Draft = z.object({
  lang: z.enum(["th", "en", "bilingual"]),
  contract_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: z.string().trim().max(200).nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  clauses: z.array(Clause).min(1).max(40),
});
export type ContractDraft = z.infer<typeof Draft>;

export async function saveContract(id: string, draft: ContractDraft): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const parsed = Draft.safeParse(draft);
  if (!parsed.success) return { error: m.contracts.errClauses };
  if (parsed.data.start_date && parsed.data.end_date && parsed.data.end_date < parsed.data.start_date) return { error: m.contracts.errDates };
  const { error } = await supabase.from("contracts").update({ ...parsed.data, clauses: parsed.data.clauses as unknown as Json }).eq("id", id).eq("status", "draft");
  if (error) return { error: error.message };
  refresh(id);
  return { message: m.contracts.saved };
}

/** Freezes the text, attaches the contractor's signature and opens the private signing link. */
export async function sendContract(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const { data: c } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c || c.status !== "draft") return { error: m.contracts.errState };
  const { data: q } = await supabase.from("documents").select("signers_snapshot").eq("id", c.quotation_id).maybeSingle();
  let signer = (q?.signers_snapshot as { signer?: unknown } | null)?.signer ?? null;
  if (!signer) {
    const { data: first } = await supabase.from("signatories").select("*").order("created_at").limit(1).maybeSingle();
    signer = first ? signatorySnapshot(first) : null;
  }
  const frozen = { ...c, owner_signer: signer as Json };
  const { error } = await supabase
    .from("contracts")
    .update({ owner_signer: signer as Json, content_hash: contractHash(frozen), sign_token: newSignToken(), sent_at: new Date().toISOString(), status: "sent" })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return { error: error.message };
  refresh(id);
  return { message: m.contracts.sentMsg };
}

/** Back to draft for changes. The signing link stops working; sending again makes a new one. */
export async function reopenContract(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contracts").update({ status: "draft", sign_token: null, content_hash: null, sent_at: null, owner_signer: null }).eq("id", id).eq("status", "sent");
  if (error) return { error: error.message };
  refresh(id);
  return {};
}

/** Both parties signed the printed copy. */
export async function markSignedOnPaper(id: string, date: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: m.contracts.errDates };
  const { data: c } = await supabase.from("contracts").select("*").eq("id", id).maybeSingle();
  if (!c || (c.status !== "draft" && c.status !== "sent")) return { error: m.contracts.errState };
  // A paper copy carries the contractor's signature line too: freeze the text as on sending.
  const patch =
    c.status === "draft"
      ? (() => {
          const frozen = { ...c, owner_signer: null };
          return { content_hash: contractHash(frozen), sent_at: new Date().toISOString() };
        })()
      : {};
  const { error } = await supabase
    .from("contracts")
    .update({ ...patch, status: "signed", signed_via: "paper", client_signed_at: `${date}T12:00:00+07:00` })
    .eq("id", id);
  if (error) return { error: error.message };
  refresh(id);
  return { message: m.contracts.signedPaperMsg };
}

export async function voidContract(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contracts").update({ status: "void", voided_at: new Date().toISOString() }).eq("id", id).neq("status", "void");
  if (error) return { error: error.message };
  refresh(id);
  return {};
}

export async function deleteContract(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("contracts").delete().eq("id", id).eq("status", "draft");
  if (error) return { error: error.message };
  refresh();
  redirect("/contracts");
}
