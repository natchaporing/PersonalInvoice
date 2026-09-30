"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { WHT_OPTIONS } from "@/lib/domain/tax";
import type { FormState } from "@/lib/domain/forms";
import type { Tables } from "@/lib/supabase/database.types";
import { deleteItem, saveItem } from "./actions";

export function ItemForm({ item }: { item?: Tables<"items"> }) {
  const [state, action] = useActionState<FormState, FormData>(saveItem, {});
  const [delState, setDelState] = useState<FormState>({});
  const [deleting, startDelete] = useTransition();
  const e = state.fieldErrors ?? {};
  const dv = (k: string, fallback: string) => state.values?.[k] ?? fallback;

  return (
    <form action={action} className="grid max-w-3xl gap-5">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Product code" htmlFor="code" error={e.code} hint="Optional. Printed when the document shows codes.">
            <Input id="code" name="code" defaultValue={dv("code", item?.code ?? "")} />
          </Field>
          <Field label="VAT rate" htmlFor="default_vat_bps" error={e.default_vat_bps}>
            <NativeSelect id="default_vat_bps" name="default_vat_bps" defaultValue={dv("default_vat_bps", String(item?.default_vat_bps ?? 700))}>
              <option value="700">7%</option>
              <option value="0">0% / exempt</option>
            </NativeSelect>
          </Field>
          <Field label="Name (Thai)" htmlFor="name_th" error={e.name_th}>
            <Input id="name_th" name="name_th" defaultValue={dv("name_th", item?.name_th ?? "")} required />
          </Field>
          <Field label="Name (English)" htmlFor="name_en" error={e.name_en}>
            <Input id="name_en" name="name_en" defaultValue={dv("name_en", item?.name_en ?? "")} />
          </Field>
          <Field label="Unit price (THB)" htmlFor="unit_price" error={e.unit_price} hint="Before VAT">
            <Input id="unit_price" name="unit_price" inputMode="decimal" className="num text-right" defaultValue={dv("unit_price", item ? (item.unit_price / 100).toFixed(2) : "")} required />
          </Field>
          <Field label="Unit" htmlFor="unit" error={e.unit} hint="e.g. งาน, ชม., เดือน">
            <Input id="unit" name="unit" defaultValue={dv("unit", item?.unit ?? "")} />
          </Field>
          <Field label="Customer usually withholds" htmlFor="default_wht_bps" error={e.default_wht_bps}>
            <NativeSelect id="default_wht_bps" name="default_wht_bps" defaultValue={dv("default_wht_bps", String(item?.default_wht_bps ?? 0))}>
              {WHT_OPTIONS.map((o) => <option key={o.bps} value={o.bps}>{o.label}</option>)}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{item ? "Save item" : "Add item"}</SubmitButton>
        {item && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => {
              if (!confirm(`Delete ${item.name_th}?`)) return;
              startDelete(async () => setDelState(await deleteItem(item.id)));
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
