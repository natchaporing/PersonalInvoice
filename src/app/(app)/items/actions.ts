"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formHelpers, formObject, type FormState, invalid, submitted } from "@/lib/domain/forms";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

function itemSchema(m: Messages) {
  const f = formHelpers(m.validation);
  return z.object({
    code: f.optText(60),
    name_th: f.reqText(m.items.nameTh, 300),
    name_en: f.optText(300),
    unit: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().max(30)),
    unit_price: f.money(m.items.unitPrice),
    default_vat_bps: z.coerce.number().int().refine((v) => [0, 700].includes(v), m.items.badVat),
    default_wht_bps: z.coerce.number().int().refine((v) => [0, 100, 200, 300, 500].includes(v), m.items.badRate),
  });
}

export async function saveItem(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const id = form.get("id");
  const parsed = itemSchema(m).safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues, m.validation.fixFields);
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("items").update(parsed.data).eq("id", id)
      : await supabase.from("items").insert(parsed.data);
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/items");
  redirect("/items");
}

export async function deleteItem(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/items");
  redirect("/items");
}
