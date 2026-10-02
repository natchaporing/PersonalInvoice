"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { branchCode, formObject, type FormState, invalid, optText, reqText, submitted, taxId } from "@/lib/domain/forms";
import { isValidGeo } from "@/lib/etax/geo";
import { requireUser } from "@/lib/supabase/server";
import { isJuristicTaxId } from "@/lib/thai/tax-id";

const Profile = z
  .object({
    name_th: reqText("Business name (Thai)", 200),
    name_en: optText(200),
    tax_id: taxId.refine((v) => !isJuristicTaxId(v), "Tra is for individuals for now: use your personal 13-digit tax ID"),
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
    addr_building_number: optText(60),
    addr_street: optText(120),
    addr_province_code: optText(2),
    addr_district_code: optText(4),
    addr_subdistrict_code: optText(6),
    addr_postcode: z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : v), z.string().regex(/^\d{5}$/, "Postcode is 5 digits").nullable()),
    bank_account_type: z.preprocess((v) => (v === "" ? null : v), z.enum(["savings", "current"]).nullable()),
  })
  .superRefine((p, ctx) => {
    // e-Tax needs the seller address as structured codes. Either leave all of it empty or complete it.
    const geo = [p.addr_building_number, p.addr_province_code, p.addr_district_code, p.addr_subdistrict_code, p.addr_postcode];
    if (geo.some(Boolean)) {
      if (!geo.every(Boolean)) {
        ctx.addIssue({ code: "custom", path: ["addr_building_number"], message: "For e-Tax fill house number, province, district, sub-district and postcode together" });
      } else if (!isValidGeo(p.addr_province_code!, p.addr_district_code!, p.addr_subdistrict_code!)) {
        ctx.addIssue({ code: "custom", path: ["addr_subdistrict_code"], message: "Choose a valid province, district and sub-district" });
      }
    }
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
