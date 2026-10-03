"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import type { Tables } from "@/lib/supabase/database.types";
import { deleteCustomer, saveCustomer } from "./actions";

export function CustomerForm({ customer, next }: { customer?: Tables<"customers">; next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveCustomer, {});
  const [delState, setDelState] = useState<FormState>({});
  const [deleting, startDelete] = useTransition();
  const e = state.fieldErrors ?? {};
  const m = useMessages();
  const t = m.customers;
  const dv = (k: keyof Tables<"customers">) => state.values?.[k] ?? (customer?.[k] as string | null | undefined) ?? "";

  return (
    <form action={action} className="grid max-w-3xl gap-5">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      {next && <input type="hidden" name="next" value={next} />}
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t.nameTh} htmlFor="name_th" error={e.name_th}>
            <Input id="name_th" name="name_th" defaultValue={dv("name_th")} required />
          </Field>
          <Field label={t.nameEn} htmlFor="name_en" error={e.name_en}>
            <Input id="name_en" name="name_en" defaultValue={dv("name_en")} />
          </Field>
          <Field label={t.taxId} htmlFor="tax_id" error={e.tax_id} hint={t.taxIdHint}>
            <Input id="tax_id" name="tax_id" inputMode="numeric" className="num" defaultValue={dv("tax_id")} />
          </Field>
          <Field label={t.branch} htmlFor="branch_code" error={e.branch_code} hint={t.branchHint}>
            <Input id="branch_code" name="branch_code" inputMode="numeric" className="num" defaultValue={dv("branch_code") || "00000"} />
          </Field>
          <Label className="font-normal sm:col-span-2">
            <input type="checkbox" name="is_juristic" className="size-4 accent-[var(--cobalt)]" defaultChecked={state.values ? state.values.is_juristic === "on" : customer?.is_juristic ?? true} />
            {t.juristic}
          </Label>
          <Field label={t.addressTh} htmlFor="address_th" error={e.address_th} hint={t.addressThHint} className="sm:col-span-2">
            <Textarea id="address_th" name="address_th" rows={2} defaultValue={dv("address_th")} />
          </Field>
          <Field label={t.addressEn} htmlFor="address_en" error={e.address_en} className="sm:col-span-2">
            <Textarea id="address_en" name="address_en" rows={2} defaultValue={dv("address_en")} />
          </Field>
          <Field label={t.email} htmlFor="email" error={e.email}>
            <Input id="email" name="email" type="email" defaultValue={dv("email")} />
          </Field>
          <Field label={t.postcode} htmlFor="postcode" error={e.postcode} hint={t.postcodeHint}>
            <Input id="postcode" name="postcode" inputMode="numeric" maxLength={5} className="num" defaultValue={dv("postcode")} />
          </Field>
          <Field label={t.phone} htmlFor="phone" error={e.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={dv("phone")} />
          </Field>
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{customer ? t.save : t.add}</SubmitButton>
        {customer && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (!confirm(m.actions.confirmDelete(customer.name_th))) return;
              startDelete(async () => setDelState(await deleteCustomer(customer.id)));
            }}
          >
            {deleting ? m.actions.deleting : m.actions.delete}
          </Button>
        )}
        <FormMessage state={delState.error ? delState : state} />
      </div>
    </form>
  );
}

