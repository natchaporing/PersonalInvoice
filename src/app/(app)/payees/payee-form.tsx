"use client";

import { useActionState, useState, useTransition } from "react";
import { BankPicker } from "@/components/bank-picker";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/domain/forms";
import type { Tables } from "@/lib/supabase/database.types";
import { findBankByName } from "@/lib/thai/banks";
import { deletePayee, savePayee } from "./actions";

export const WHT_CHOICES = [
  { bps: 0, label: "No withholding" },
  { bps: 300, label: "3% · commission / service" },
  { bps: 100, label: "1%" },
  { bps: 200, label: "2%" },
  { bps: 500, label: "5%" },
];

export function PayeeForm({ payee, next }: { payee?: Tables<"commission_payees">; next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(savePayee, {});
  const [delState, setDelState] = useState<FormState>({});
  const [deleting, startDelete] = useTransition();
  const e = state.fieldErrors ?? {};
  const dv = (k: string, fallback = "") => state.values?.[k] ?? fallback;
  const [bank, setBank] = useState(dv("bank_name", payee?.bank_name ?? ""));

  return (
    <form action={action} className="grid max-w-3xl gap-5">
      {payee && <input type="hidden" name="id" value={payee.id} />}
      {next && <input type="hidden" name="next" value={next} />}
      <Card>
        <CardHeader><CardTitle>Payee · ผู้รับค่านายหน้า</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="p_name" error={e.name} className="sm:col-span-2">
            <Input id="p_name" name="name" defaultValue={dv("name", payee?.name ?? "")} required />
          </Field>
          <Label className="font-normal sm:col-span-2">
            <input type="checkbox" name="is_juristic" className="size-4 accent-[var(--cobalt)]" defaultChecked={state.values ? state.values.is_juristic === "on" : payee?.is_juristic ?? false} />
            Company / juristic person (withholding filed on PND 53). Untick for an individual (PND 3).
          </Label>
          <Field label="Tax ID / national ID" htmlFor="p_tax" error={e.tax_id} hint="13 digits. Needed on the 50 Tawi if you withhold.">
            <Input id="p_tax" name="tax_id" inputMode="numeric" className="num" defaultValue={dv("tax_id", payee?.tax_id ?? "")} />
          </Field>
          <Field label="Phone" htmlFor="p_phone" error={e.phone}>
            <Input id="p_phone" name="phone" type="tel" defaultValue={dv("phone", payee?.phone ?? "")} />
          </Field>
          <Field label="Email" htmlFor="p_email" error={e.email}>
            <Input id="p_email" name="email" type="email" defaultValue={dv("email", payee?.email ?? "")} />
          </Field>
          <Field label="Address" htmlFor="p_address" error={e.address} className="sm:col-span-2">
            <Textarea id="p_address" name="address" rows={2} defaultValue={dv("address", payee?.address ?? "")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer to · บัญชีรับโอน</CardTitle>
          <CardDescription>Where you send the commission.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <span className="text-[13px] font-medium">Bank</span>
            <BankPicker selected={findBankByName(bank, bank)} onSelect={(b) => setBank(b.th)} />
            <input type="hidden" name="bank_name" value={bank} />
          </div>
          <Field label="Account name" htmlFor="p_acc_name" error={e.bank_account_name}>
            <Input id="p_acc_name" name="bank_account_name" defaultValue={dv("bank_account_name", payee?.bank_account_name ?? "")} />
          </Field>
          <Field label="Account number" htmlFor="p_acc_no" error={e.bank_account_number}>
            <Input id="p_acc_no" name="bank_account_number" inputMode="numeric" className="num" defaultValue={dv("bank_account_number", payee?.bank_account_number ?? "")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defaults · ค่าเริ่มต้น</CardTitle>
          <CardDescription>Filled in when you pick this payee on a quotation. You can still change them each time.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Commission rate (%)" htmlFor="p_rate" error={e.default_rate} hint="Of the amount before VAT. Leave empty if it varies.">
            <Input id="p_rate" name="default_rate" inputMode="decimal" className="num text-right" defaultValue={dv("default_rate", payee?.default_rate_bps ? String(payee.default_rate_bps / 100) : "")} />
          </Field>
          <Field label="Withhold when paying" htmlFor="p_wht" error={e.default_wht_bps}>
            <NativeSelect id="p_wht" name="default_wht_bps" defaultValue={dv("default_wht_bps", String(payee?.default_wht_bps ?? 300))}>
              {WHT_CHOICES.map((w) => <option key={w.bps} value={w.bps}>{w.label}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Note" htmlFor="p_note" error={e.note} className="sm:col-span-2">
            <Input id="p_note" name="note" defaultValue={dv("note", payee?.note ?? "")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{payee ? "Save payee" : "Add payee"}</SubmitButton>
        {payee && (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" disabled={deleting}
            onClick={() => confirm(`Delete ${payee.name}? Commissions already recorded keep their details.`) && startDelete(async () => setDelState(await deletePayee(payee.id)))}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        <FormMessage state={delState.error ? delState : state} />
      </div>
    </form>
  );
}
