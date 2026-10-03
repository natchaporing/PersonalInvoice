"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formHelpers, formObject, type FormState, invalid, submitted } from "@/lib/domain/forms";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { isValidGeo } from "@/lib/etax/geo";
import { requireUser } from "@/lib/supabase/server";
import { isJuristicTaxId } from "@/lib/thai/tax-id";

function profileSchema(m: Messages) {
  const f = formHelpers(m.validation);
  const t = m.profile;
  return z
  .object({
    name_th: f.reqText(t.businessNameTh, 200),
    name_en: f.optText(200),
    tax_id: f.taxId.refine((v) => !isJuristicTaxId(v), t.errIndividual),
    branch_code: f.branchCode,
    address_th: f.reqText(t.addressTh, 500),
    address_en: f.optText(500),
    phone: f.optText(50),
    email: f.optText(200),
    bank_name_th: f.optText(100),
    bank_name_en: f.optText(100),
    bank_branch_th: f.optText(100),
    bank_branch_en: f.optText(100),
    bank_account_name: f.optText(200),
    bank_account_name_en: f.optText(200),
    bank_account_number: z.preprocess(
      (v) => (typeof v === "string" ? v.replace(/\D/g, "") || null : v),
      z.string().regex(/^\d{6,20}$/, t.errAccount).nullable(),
    ),
    addr_building_number: f.optText(60),
    addr_street: f.optText(120),
    addr_province_code: f.optText(2),
    addr_district_code: f.optText(4),
    addr_subdistrict_code: f.optText(6),
    addr_postcode: f.postcode,
    bank_account_type: z.preprocess((v) => (v === "" ? null : v), z.enum(["savings", "current"]).nullable()),
  })
  .superRefine((p, ctx) => {
    // e-Tax needs the seller address as structured codes. Either leave all of it empty or complete it.
    const geo = [p.addr_building_number, p.addr_province_code, p.addr_district_code, p.addr_subdistrict_code, p.addr_postcode];
    if (geo.some(Boolean)) {
      if (!geo.every(Boolean)) {
        ctx.addIssue({ code: "custom", path: ["addr_building_number"], message: t.errEtaxTogether });
      } else if (!isValidGeo(p.addr_province_code!, p.addr_district_code!, p.addr_subdistrict_code!)) {
        ctx.addIssue({ code: "custom", path: ["addr_subdistrict_code"], message: t.errGeo });
      }
    }
    const bank = [p.bank_name_th, p.bank_account_name, p.bank_account_number];
    if (bank.some(Boolean) && !bank.every(Boolean)) {
      ctx.addIssue({ code: "custom", path: ["bank_account_number"], message: t.errBankTogether });
    }
  });
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const m = await getMessages();
  const parsed = profileSchema(m).safeParse(formObject(form));
  if (!parsed.success) return invalid(form, parsed.error.issues, m.validation.fixFields);
  const { error } = await supabase.from("business_profiles").upsert({ owner_id: user.id, ...parsed.data });
  if (error) return { error: error.message, values: submitted(form) };
  revalidatePath("/", "layout");
  return { message: m.profile.saved };
}
