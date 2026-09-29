"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { branchCode, formObject, type FormState, invalid, optText, reqText, submitted, taxId } from "@/lib/domain/forms";
import { requireUser } from "@/lib/supabase/server";

const Profile = z
  .object({
    name_th: reqText("Business name (Thai)", 200),
    name_en: optText(200),
    tax_id: taxId,
    branch_code: branchCode,
    address_th: reqText("Address (Thai)", 500),
    address_en: optText(500),
    phone: optText(50),
    email: optText(200),
    bank_name_th: optText(100),
    bank_name_en: optText(100),
    bank_branch_th: optText(100),
    bank_branch_en: optText(100),
    bank_account_name: optText(200),
    bank_account_name_en: optText(200),
    bank_account_number: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : v),
      z.string().regex(/^\d{6,20}$/, "Account number should be 6–20 digits").nullable(),
    ),
    bank_account_type: z.preprocess((v) => (v === "" ? null : v), z.enum(["savings", "current"]).nullable()),
  })
  .superRefine((p, ctx) => {
    const bank = [p.bank_name_th, p.bank_account_name, p.bank_account_number];
    if (bank.some(Boolean) && !bank.every(Boolean)) {
      ctx.addIssue({ code: "custom", path: ["bank_account_number"], message: "Fill bank name, account name and account number together" });
    }
  });

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const parsed = Profile.safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues);
  const { error } = await supabase.from("business_profiles").upsert({ owner_id: user.id, ...parsed.data });
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/", "layout");
  return { message: "Business profile saved." };
}
