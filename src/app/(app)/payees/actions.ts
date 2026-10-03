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
