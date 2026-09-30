"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formObject, type FormState, invalid, optText, reqText, submitted } from "@/lib/domain/forms";
import { requireUser } from "@/lib/supabase/server";

const MAX_IMAGE = 250 * 1024; // ~333 KB as base64, under the 400 KB column limit

const Signatory = z.object({
  name_th: reqText("Name (Thai)", 200),
  name_en: optText(200),
  title_th: optText(200),
  title_en: optText(200),
});

/** Add a person who can sign or approve documents. The signature image is stored as a small data URL. */
export async function addSignatory(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = Signatory.safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues);

  let signature_image: string | null = null;
  const file = form.get("signature");
  if (file instanceof File && file.size > 0) {
    if (file.type !== "image/png" && file.type !== "image/jpeg") return { error: "Signature must be a PNG or JPEG image.", values: submitted(form) };
    if (file.size > MAX_IMAGE) return { error: "Signature image is larger than 250 KB. Use a smaller image.", values: submitted(form) };
    signature_image = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  }

  const { error } = await supabase.from("signatories").insert({ ...parsed.data, signature_image });
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/settings");
  return { message: "Signatory added." };
}

/** Remove a signatory. Documents already issued keep their frozen copy; drafts fall back to a blank line. */
export async function deleteSignatory(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("signatories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { message: "Signatory removed." };
}
