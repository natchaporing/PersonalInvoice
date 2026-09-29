"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import type { Tables } from "@/lib/supabase/database.types";
import { saveProfile } from "./actions";

export function ProfileForm({ profile }: { profile: Tables<"business_profiles"> | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveProfile, {});
  const e = state.fieldErrors ?? {};
  const v = (k: keyof Tables<"business_profiles">) => state.values?.[k] ?? (profile?.[k] as string | null | undefined) ?? "";

  return (
    <form action={action} className="grid max-w-4xl gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Business · ผู้ประกอบการ</CardTitle>
          <CardDescription>Printed as the seller on tax invoices (Revenue Code s.86/4).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (Thai)" htmlFor="name_th" error={e.name_th}>
            <Input id="name_th" name="name_th" defaultValue={v("name_th")} required />
          </Field>
          <Field label="Name (English)" htmlFor="name_en" error={e.name_en}>
            <Input id="name_en" name="name_en" defaultValue={v("name_en")} />
          </Field>
          <Field label="Tax ID" htmlFor="tax_id" error={e.tax_id} hint="13 digits">
            <Input id="tax_id" name="tax_id" inputMode="numeric" className="num" defaultValue={v("tax_id")} required />
          </Field>
          <Field label="Branch" htmlFor="branch_code" error={e.branch_code} hint="00000 = head office (สำนักงานใหญ่)">
            <Input id="branch_code" name="branch_code" inputMode="numeric" className="num" defaultValue={v("branch_code") || "00000"} />
          </Field>
          <Field label="Address (Thai)" htmlFor="address_th" error={e.address_th} className="sm:col-span-2">
            <Textarea id="address_th" name="address_th" rows={2} defaultValue={v("address_th")} required />
          </Field>
          <Field label="Address (English)" htmlFor="address_en" error={e.address_en} className="sm:col-span-2">
            <Textarea id="address_en" name="address_en" rows={2} defaultValue={v("address_en")} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={e.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={v("phone")} />
          </Field>
          <Field label="Email" htmlFor="email" error={e.email}>
            <Input id="email" name="email" type="email" defaultValue={v("email")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank account · บัญชีรับโอน</CardTitle>
          <CardDescription>Printed on invoices, tax invoices and debit notes so customers know where to transfer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank (Thai)" htmlFor="bank_name_th" error={e.bank_name_th} hint="e.g. ธนาคารกสิกรไทย">
            <Input id="bank_name_th" name="bank_name_th" defaultValue={v("bank_name_th")} />
          </Field>
          <Field label="Bank (English)" htmlFor="bank_name_en" error={e.bank_name_en} hint="e.g. Kasikornbank">
            <Input id="bank_name_en" name="bank_name_en" defaultValue={v("bank_name_en")} />
          </Field>
          <Field label="Branch (Thai)" htmlFor="bank_branch_th" error={e.bank_branch_th}>
            <Input id="bank_branch_th" name="bank_branch_th" defaultValue={v("bank_branch_th")} />
          </Field>
          <Field label="Branch (English)" htmlFor="bank_branch_en" error={e.bank_branch_en}>
            <Input id="bank_branch_en" name="bank_branch_en" defaultValue={v("bank_branch_en")} />
          </Field>
          <Field label="Account name (Thai)" htmlFor="bank_account_name" error={e.bank_account_name}>
            <Input id="bank_account_name" name="bank_account_name" defaultValue={v("bank_account_name")} />
          </Field>
          <Field label="Account name (English)" htmlFor="bank_account_name_en" error={e.bank_account_name_en}>
            <Input id="bank_account_name_en" name="bank_account_name_en" defaultValue={v("bank_account_name_en")} />
          </Field>
          <Field label="Account number" htmlFor="bank_account_number" error={e.bank_account_number}>
            <Input id="bank_account_number" name="bank_account_number" inputMode="numeric" className="num" defaultValue={v("bank_account_number")} />
          </Field>
          <Field label="Account type" htmlFor="bank_account_type" error={e.bank_account_type}>
            <NativeSelect id="bank_account_type" name="bank_account_type" defaultValue={v("bank_account_type")}>
              <option value="">—</option>
              <option value="savings">Savings · ออมทรัพย์</option>
              <option value="current">Current · กระแสรายวัน</option>
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save profile</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
