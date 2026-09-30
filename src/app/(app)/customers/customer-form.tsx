"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/domain/forms";
import type { Tables } from "@/lib/supabase/database.types";
import { deleteCustomer, saveCustomer } from "./actions";

export function CustomerForm({ customer, next }: { customer?: Tables<"customers">; next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveCustomer, {});
  const [delState, setDelState] = useState<FormState>({});
  const [deleting, startDelete] = useTransition();
  const e = state.fieldErrors ?? {};
  const dv = (k: keyof Tables<"customers">) => state.values?.[k] ?? (customer?.[k] as string | null | undefined) ?? "";

  return (
    <form action={action} className="grid max-w-3xl gap-5">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      {next && <input type="hidden" name="next" value={next} />}
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name (Thai)" htmlFor="name_th" error={e.name_th}>
            <Input id="name_th" name="name_th" defaultValue={dv("name_th")} required />
          </Field>
          <Field label="Name (English)" htmlFor="name_en" error={e.name_en}>
            <Input id="name_en" name="name_en" defaultValue={dv("name_en")} />
          </Field>
          <Field label="Tax ID" htmlFor="tax_id" error={e.tax_id} hint="13 digits. Required for tax invoices.">
            <Input id="tax_id" name="tax_id" inputMode="numeric" className="num" defaultValue={dv("tax_id")} />
          </Field>
          <Field label="Branch" htmlFor="branch_code" error={e.branch_code} hint="00000 = head office">
            <Input id="branch_code" name="branch_code" inputMode="numeric" className="num" defaultValue={dv("branch_code") || "00000"} />
          </Field>
          <Label className="font-normal sm:col-span-2">
            <input type="checkbox" name="is_juristic" className="size-4 accent-[var(--cobalt)]" defaultChecked={state.values ? state.values.is_juristic === "on" : customer?.is_juristic ?? true} />
            Company / juristic person (withholds via PND 53). Untick for an individual (PND 3).
          </Label>
          <Field label="Address (Thai)" htmlFor="address_th" error={e.address_th} hint="Required for tax invoices." className="sm:col-span-2">
            <Textarea id="address_th" name="address_th" rows={2} defaultValue={dv("address_th")} />
          </Field>
          <Field label="Address (English)" htmlFor="address_en" error={e.address_en} className="sm:col-span-2">
            <Textarea id="address_en" name="address_en" rows={2} defaultValue={dv("address_en")} />
          </Field>
          <Field label="Email" htmlFor="email" error={e.email}>
            <Input id="email" name="email" type="email" defaultValue={dv("email")} />
          </Field>
          <Field label="Postcode" htmlFor="postcode" error={e.postcode} hint="5 digits. Needed for e-Tax invoices.">
            <Input id="postcode" name="postcode" inputMode="numeric" maxLength={5} className="num" defaultValue={dv("postcode")} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={e.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={dv("phone")} />
          </Field>
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{customer ? "Save customer" : "Add customer"}</SubmitButton>
        {customer && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (!confirm(`Delete ${customer.name_th}?`)) return;
              startDelete(async () => setDelState(await deleteCustomer(customer.id)));
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        <FormMessage state={delState.error ? delState : state} />
      </div>
    </form>
  );
}

