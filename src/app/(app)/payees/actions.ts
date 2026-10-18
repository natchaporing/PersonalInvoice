"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkbox, formHelpers, formObject, type FormState, invalid, submitted } from "@/lib/domain/forms";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

function payeeSchema(m: Messages) {
  const f = formHelpers(m.validation);
  const t = m.payees;
  return z.object({
    name: f.reqText(t.name, 200),
    is_juristic: checkbox,
    tax_id: f.optTaxId,
    address: f.optText(500),
    phone: f.optText(50),
    email: f.optText(200),
    bank_name: f.optText(100),
    bank_account_name: f.optText(200),
    bank_account_number: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : v),
      z.string().regex(/^\d{6,20}$/, t.errAccount).nullable(),
    ),
    promptpay_id: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : v),
      z.string().regex(/^(\d{10}|\d{13}|\d{15})$/, t.errPromptPay).nullable(),
    ),
    default_rate: z.preprocess(
      (v) => (typeof v === "string" && v.trim() !== "" ? Number(v.replace(/,/g, "")) : null),
      z.number({ message: t.errRateNumber }).positive(t.errRatePositive).max(100, t.errRateMax).nullable(),
    ),
    default_wht_bps: z.coerce.number().int().refine((v) => [0, 100, 200, 300, 500].includes(v), t.errUnsupported),
    note: f.optText(500),
  });
}

/** Create or update a commission payee. `next` returns to the quotation the payee was added from. */
export async function savePayee(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const id = form.get("id");
  const parsed = payeeSchema(m).safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues, m.validation.fixFields);
  const { default_rate, ...rest } = parsed.data;
  const row = { ...rest, default_rate_bps: default_rate == null ? null : Math.round(default_rate * 100) };
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("commission_payees").update(row).eq("id", id)
      : await supabase.from("commission_payees").insert(row);
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/payees");
  const next = form.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/payees");
}

/** Recorded commissions keep their own copy of the payee's name and account, so deleting a profile is safe. */
export async function deletePayee(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("commission_payees").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/payees");
  redirect("/payees");
}


/** Undo a mistaken "paid": back to waiting for payment. */
export async function unmarkCommissionPaid(commissionId: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const { data, error } = await supabase.from("commissions").update({ paid_on: null, paid_reference: null }).eq("id", commissionId).select("payee_id, quotation_id").maybeSingle();
  if (error) return { error: error.message };
  if (data) revalidateCommission(data);
  return { message: m.payees.undone };
}

function revalidateCommission(c: { payee_id: string | null; quotation_id: string }) {
  revalidatePath("/payees");
  if (c.payee_id) revalidatePath(`/payees/${c.payee_id}`);
  revalidatePath(`/documents/${c.quotation_id}`);
}

const PayMany = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  method: z.enum(["transfer", "promptpay", "cash"]),
  reference: z.string().trim().max(200),
});

/** Several commissions paid in one go: same date, method and reference. Already-paid ones are left as they are. */
export async function payCommissions(input: z.infer<typeof PayMany>): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const parsed = PayMany.safeParse(input);
  if (!parsed.success) return { error: m.payees.errPayMany };
  const { ids, paid_on, method, reference } = parsed.data;
  const label = method === "cash" ? m.payees.cashReference : method === "promptpay" ? "PromptPay" : "";
  const paid_reference = [label, reference].filter(Boolean).join(" · ") || null;
  const { data, error } = await supabase.from("commissions").update({ paid_on, paid_reference }).in("id", ids).is("paid_on", null).select("payee_id, quotation_id");
  if (error) return { error: error.message };
  for (const c of data ?? []) revalidateCommission(c);
  revalidatePath("/payees");
  return { message: m.payees.paidMany(data?.length ?? 0) };
}
