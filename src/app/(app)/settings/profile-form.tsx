"use client";

import { useActionState, useState, useTransition } from "react";
import { BankPicker } from "@/components/bank-picker";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import type { GeoOption } from "@/lib/etax/geo";
import { useMessages } from "@/lib/i18n/client";
import type { Tables } from "@/lib/supabase/database.types";
import { type Bank, findBankByName } from "@/lib/thai/banks";
import { saveProfile } from "./actions";
import { districtsOf, subdistrictsOf } from "./geo-actions";

export function ProfileForm({
  profile,
  defaults,
  provinces,
  initialDistricts,
  initialSubdistricts,
}: {
  profile: Tables<"business_profiles"> | null;
  /** Prefill for a new profile, from what was given at sign-up. */
  defaults?: Partial<Record<keyof Tables<"business_profiles">, string>>;
  provinces: GeoOption[];
  initialDistricts: GeoOption[];
  initialSubdistricts: GeoOption[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveProfile, {});
  const e = state.fieldErrors ?? {};
  const t = useMessages().profile;
  const v = (k: keyof Tables<"business_profiles">) => state.values?.[k] ?? (profile?.[k] as string | null | undefined) ?? (profile ? "" : defaults?.[k]) ?? "";
  const [bankTh, setBankTh] = useState(v("bank_name_th"));
  const [bankEn, setBankEn] = useState(v("bank_name_en"));
  const picked = findBankByName(bankTh, bankEn);
  const [province, setProvince] = useState(v("addr_province_code"));
  const [district, setDistrict] = useState(v("addr_district_code"));
  const [subdistrict, setSubdistrict] = useState(v("addr_subdistrict_code"));
  const [districts, setDistricts] = useState(initialDistricts);
  const [subdistricts, setSubdistricts] = useState(initialSubdistricts);
  const [loadingGeo, startGeo] = useTransition();
  const pickProvince = (code: string) => {
    setProvince(code);
    setDistrict("");
    setSubdistrict("");
    setSubdistricts([]);
    startGeo(async () => setDistricts(code ? await districtsOf(code) : []));
  };
  const pickDistrict = (code: string) => {
    setDistrict(code);
    setSubdistrict("");
    startGeo(async () => setSubdistricts(code ? await subdistrictsOf(code) : []));
  };
  const choose = (b: Bank) => {
    setBankTh(b.th);
    setBankEn(b.en);
  };

  return (
    <form action={action} className="grid max-w-4xl gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t.business}</CardTitle>
          <CardDescription>{t.businessNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t.nameTh} htmlFor="name_th" error={e.name_th}>
            <Input id="name_th" name="name_th" defaultValue={v("name_th")} required />
          </Field>
          <Field label={t.nameEn} htmlFor="name_en" error={e.name_en}>
            <Input id="name_en" name="name_en" defaultValue={v("name_en")} />
          </Field>
          <Field label={t.taxId} htmlFor="tax_id" error={e.tax_id} hint={t.taxIdHint}>
            <Input id="tax_id" name="tax_id" inputMode="numeric" className="num" defaultValue={v("tax_id")} required />
          </Field>
          <Field label={t.branch} htmlFor="branch_code" error={e.branch_code} hint={t.branchHint}>
            <Input id="branch_code" name="branch_code" inputMode="numeric" className="num" defaultValue={v("branch_code") || "00000"} />
          </Field>
          <Field label={t.addressTh} htmlFor="address_th" error={e.address_th} className="sm:col-span-2">
            <Textarea id="address_th" name="address_th" rows={2} defaultValue={v("address_th")} required />
          </Field>
          <Field label={t.addressEn} htmlFor="address_en" error={e.address_en} className="sm:col-span-2">
            <Textarea id="address_en" name="address_en" rows={2} defaultValue={v("address_en")} />
          </Field>
          <Field label={t.phone} htmlFor="phone" error={e.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={v("phone")} />
          </Field>
          <Field label={t.email} htmlFor="email" error={e.email}>
            <Input id="email" name="email" type="email" defaultValue={v("email")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.etaxAddress}</CardTitle>
          <CardDescription>{t.etaxAddressNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label={t.building} htmlFor="addr_building_number" error={e.addr_building_number} hint={t.buildingHint}>
            <Input id="addr_building_number" name="addr_building_number" defaultValue={v("addr_building_number")} />
          </Field>
          <Field label={t.street} htmlFor="addr_street" error={e.addr_street} hint={t.streetHint}>
            <Input id="addr_street" name="addr_street" defaultValue={v("addr_street")} />
          </Field>
          <Field label={t.province} htmlFor="addr_province_code" error={e.addr_province_code}>
            <NativeSelect id="addr_province_code" name="addr_province_code" value={province} onChange={(ev) => pickProvince(ev.target.value)}>
              <option value="">{t.choose}</option>
              {provinces.map((p) => (<option key={p.code} value={p.code}>{p.name}</option>))}
            </NativeSelect>
          </Field>
          <Field label={t.district} htmlFor="addr_district_code" error={e.addr_district_code}>
            <NativeSelect id="addr_district_code" name="addr_district_code" value={district} onChange={(ev) => pickDistrict(ev.target.value)} disabled={!province}>
              <option value="">{loadingGeo && province ? t.loading : t.choose}</option>
              {districts.map((d) => (<option key={d.code} value={d.code}>{d.name}</option>))}
            </NativeSelect>
          </Field>
          <Field label={t.subdistrict} htmlFor="addr_subdistrict_code" error={e.addr_subdistrict_code}>
            <NativeSelect id="addr_subdistrict_code" name="addr_subdistrict_code" value={subdistrict} onChange={(ev) => setSubdistrict(ev.target.value)} disabled={!district}>
              <option value="">{loadingGeo && district ? t.loading : t.choose}</option>
              {subdistricts.map((d) => (<option key={d.code} value={d.code}>{d.name}</option>))}
            </NativeSelect>
          </Field>
          <Field label={t.postcode} htmlFor="addr_postcode" error={e.addr_postcode}>
            <Input id="addr_postcode" name="addr_postcode" inputMode="numeric" maxLength={5} className="num" defaultValue={v("addr_postcode")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.bankAccount}</CardTitle>
          <CardDescription>{t.bankAccountNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <span className="text-[13px] font-medium leading-none">{t.chooseBank}</span>
            <BankPicker selected={picked} onSelect={choose} />
            <p className="text-[12px] text-muted-foreground">{t.bankSearchHint}</p>
          </div>
          <Field label={t.bankTh} htmlFor="bank_name_th" error={e.bank_name_th}>
            <Input id="bank_name_th" name="bank_name_th" value={bankTh} onChange={(ev) => setBankTh(ev.target.value)} />
          </Field>
          <Field label={t.bankEn} htmlFor="bank_name_en" error={e.bank_name_en}>
            <Input id="bank_name_en" name="bank_name_en" value={bankEn} onChange={(ev) => setBankEn(ev.target.value)} />
          </Field>
          <Field label={t.bankBranchTh} htmlFor="bank_branch_th" error={e.bank_branch_th}>
            <Input id="bank_branch_th" name="bank_branch_th" defaultValue={v("bank_branch_th")} />
          </Field>
          <Field label={t.bankBranchEn} htmlFor="bank_branch_en" error={e.bank_branch_en}>
            <Input id="bank_branch_en" name="bank_branch_en" defaultValue={v("bank_branch_en")} />
          </Field>
          <Field label={t.accountNameTh} htmlFor="bank_account_name" error={e.bank_account_name}>
            <Input id="bank_account_name" name="bank_account_name" defaultValue={v("bank_account_name")} />
          </Field>
          <Field label={t.accountNameEn} htmlFor="bank_account_name_en" error={e.bank_account_name_en}>
            <Input id="bank_account_name_en" name="bank_account_name_en" defaultValue={v("bank_account_name_en")} />
          </Field>
          <Field label={t.accountNumber} htmlFor="bank_account_number" error={e.bank_account_number}>
            <Input id="bank_account_number" name="bank_account_number" inputMode="numeric" className="num" defaultValue={v("bank_account_number")} />
          </Field>
          <Field label={t.accountType} htmlFor="bank_account_type" error={e.bank_account_type}>
            <NativeSelect id="bank_account_type" name="bank_account_type" defaultValue={v("bank_account_type")}>
              <option value="">—</option>
              <option value="savings">{t.savings}</option>
              <option value="current">{t.current}</option>
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{t.save}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
