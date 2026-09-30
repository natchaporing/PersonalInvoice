"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formObject, type FormState, invalid, money, optText, reqText, submitted } from "@/lib/domain/forms";
import { requireUser } from "@/lib/supabase/server";

const Item = z.object({
  code: optText(60),
  name_th: reqText("Name (Thai)", 300),
  name_en: optText(300),
  unit: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().max(30)),
  unit_price: money("Unit price"),
  default_vat_bps: z.coerce.number().int().refine((v) => [0, 700].includes(v), "Unsupported VAT rate"),
  default_wht_bps: z.coerce.number().int().refine((v) => [0, 100, 200, 300, 500].includes(v), "Unsupported rate"),
});

export async function saveItem(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const id = form.get("id");
  const parsed = Item.safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues);
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
