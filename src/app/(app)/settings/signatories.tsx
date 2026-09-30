"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import type { Tables } from "@/lib/supabase/database.types";
import { addSignatory, deleteSignatory } from "./signatory-actions";

export function Signatories({ people }: { people: Tables<"signatories">[] }) {
  const [state, action] = useActionState<FormState, FormData>(addSignatory, {});
  const [pending, startTransition] = useTransition();
  const e = state.fieldErrors ?? {};
  const dv = (k: string) => state.values?.[k] ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signatories · ผู้ลงนาม</CardTitle>
        <CardDescription>
          People who issue or approve documents. Their name, title and signature image are printed and frozen on each document when it is issued; the signed PDF also records who issued and approved it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {people.length > 0 && (
          <ul className="divide-y rounded-md border">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded border bg-white">
                  {p.signature_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.signature_image} alt={`Signature of ${p.name_th}`} className="max-h-11 max-w-full object-contain" />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">no image</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{p.name_th}{p.name_en ? <span className="font-normal text-muted-foreground"> · {p.name_en}</span> : null}</div>
                  <div className="text-[13px] text-muted-foreground">{[p.title_th, p.title_en].filter(Boolean).join(" · ") || "No title"}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${p.name_th}`}
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Remove ${p.name_th}? Issued documents keep their copy.`)) startTransition(async () => { await deleteSignatory(p.id); });
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form action={action} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Field label="Name (Thai)" htmlFor="sg_name_th" error={e.name_th}>
            <Input id="sg_name_th" name="name_th" defaultValue={dv("name_th")} required />
          </Field>
          <Field label="Name (English)" htmlFor="sg_name_en" error={e.name_en}>
            <Input id="sg_name_en" name="name_en" defaultValue={dv("name_en")} />
          </Field>
          <Field label="Title (Thai)" htmlFor="sg_title_th" error={e.title_th}>
            <Input id="sg_title_th" name="title_th" defaultValue={dv("title_th")} />
          </Field>
          <Field label="Title (English)" htmlFor="sg_title_en" error={e.title_en}>
            <Input id="sg_title_en" name="title_en" defaultValue={dv("title_en")} />
          </Field>
          <Field className="sm:col-span-2" label="Signature image" htmlFor="sg_signature" hint="PNG or JPEG under 250 KB. A transparent PNG looks best.">
            <Input id="sg_signature" name="signature" type="file" accept="image/png,image/jpeg" />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <SubmitButton>Add signatory</SubmitButton>
            <FormMessage state={state} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
