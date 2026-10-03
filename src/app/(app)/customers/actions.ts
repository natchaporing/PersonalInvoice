"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkbox, formHelpers, formObject, type FormState, invalid, submitted } from "@/lib/domain/forms";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

function customerSchema(m: Messages) {
  const f = formHelpers(m.validation);
  return z.object({
    name_th: f.reqText(m.customers.nameTh, 200),
    name_en: f.optText(200),
    tax_id: f.optTaxId,
    branch_code: f.branchCode,
    is_juristic: checkbox,
    address_th: f.optText(500),
    address_en: f.optText(500),
    email: f.optText(200),
    postcode: f.postcode,
    phone: f.optText(50),
  });
}

export async function saveCustomer(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const id = form.get("id");
  const parsed = customerSchema(m).safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues, m.validation.fixFields);

  const { error } =
    typeof id === "string" && id
      ? await supabase.from("customers").update(parsed.data).eq("id", id)
      : await supabase.from("customers").insert(parsed.data);
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/customers");
  redirect(typeof form.get("next") === "string" && String(form.get("next")).startsWith("/") ? String(form.get("next")) : "/customers");
}

export async function deleteCustomer(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("customer_id", id);
  if (count) return { error: (await getMessages()).customers.hasDocuments(count) };
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/customers");
  redirect("/customers");
}
