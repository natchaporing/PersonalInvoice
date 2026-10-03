"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formHelpers, formObject, type FormState, invalid, submitted } from "@/lib/domain/forms";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

const MAX_IMAGE = 250 * 1024; // ~333 KB as base64, under the 400 KB column limit

function signatorySchema(m: Messages) {
  const f = formHelpers(m.validation);
  return z.object({
    name_th: f.reqText(m.signatories.nameTh, 200),
    name_en: f.optText(200),
    title_th: f.optText(200),
    title_en: f.optText(200),
  });
}

/** A PNG drawn on the signature pad, as a data URL. Checked to really be a PNG and small enough to store. */
function drawnSignature(value: FormDataEntryValue | null, t: Messages["signatories"]): { png: string | null; error?: string } {
  if (typeof value !== "string" || !value) return { png: null };
  const data = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!data) return { png: null, error: t.errRead };
  const bytes = Buffer.from(data[1], "base64");
  if (bytes.length > MAX_IMAGE) return { png: null, error: t.errLarge };
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return { png: null, error: t.errNotPng };
  return { png: value };
}

/** Add a person who can sign or approve documents. The signature image is stored as a small data URL. */
export async function addSignatory(_: FormState, form: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const m = await getMessages();
  const t = m.signatories;
  const parsed = signatorySchema(m).safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues, m.validation.fixFields);

  const drawn = drawnSignature(form.get("signature_drawn"), t);
  if (drawn.error) return { error: drawn.error, values: submitted(form) };
  let signature_image: string | null = drawn.png;
  const file = form.get("signature");
  if (!signature_image && file instanceof File && file.size > 0) {
    if (file.type !== "image/png" && file.type !== "image/jpeg") return { error: t.errType, values: submitted(form) };
    if (file.size > MAX_IMAGE) return { error: t.errSize, values: submitted(form) };
    signature_image = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  }

  const { error } = await supabase.from("signatories").insert({ ...parsed.data, signature_image });
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/settings");
  return { message: t.added };
}

/** Replace a signatory's signature with a newly drawn one. Documents already issued keep the old one. */
export async function updateSignature(id: string, png: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const t = (await getMessages()).signatories;
  const drawn = drawnSignature(png, t);
  if (drawn.error || !drawn.png) return { error: drawn.error ?? t.errDrawFirst };
  const { error } = await supabase.from("signatories").update({ signature_image: drawn.png }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { message: t.updated };
}

/** Remove a signatory. Documents already issued keep their frozen copy; drafts fall back to a blank line. */
export async function deleteSignatory(id: string): Promise<FormState> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("signatories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { message: (await getMessages()).signatories.removed };
}
