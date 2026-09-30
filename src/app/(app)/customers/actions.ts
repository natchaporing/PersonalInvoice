"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { branchCode, checkbox, formObject, type FormState, invalid, optTaxId, optText, reqText, submitted } from "@/lib/domain/forms";
import { requireUser } from "@/lib/supabase/server";

const Customer = z.object({
  name_th: reqText("Name (Thai)", 200),
  name_en: optText(200),
  tax_id: optTaxId,
  branch_code: branchCode,
  is_juristic: checkbox,
  address_th: optText(500),
  address_en: optText(500),
  email: optText(200),
  postcode: z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : v), z.string().regex(/^\d{5}$/, "Postcode is 5 digits").nullable()),
  phone: optText(50),
});

export async function saveCustomer(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const id = form.get("id");
  const parsed = Customer.safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues);

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
  if (count) return { error: `This customer has ${count} document(s) and cannot be deleted.` };
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/customers");
  redirect("/customers");
}
