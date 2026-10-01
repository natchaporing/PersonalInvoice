"use client";

import { PenLine, Trash2, Upload } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { addSignatory, deleteSignatory, updateSignature } from "./signatory-actions";

function SignatureThumb({ p }: { p: Tables<"signatories"> }) {
  return (
    <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded border bg-white">
      {p.signature_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.signature_image} alt={`Signature of ${p.name_th}`} className="max-h-11 max-w-full object-contain" />
      ) : (
        <span className="text-[11px] text-muted-foreground">no image</span>
      )}
    </div>
  );
}

/** One person in the list, with an inline pad to draw a new signature. */
function Person({ p }: { p: Tables<"signatories"> }) {
  const [drawing, setDrawing] = useState(false);
  const [png, setPng] = useState<string | null>(null);
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-4">
        <SignatureThumb p={p} />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{p.name_th}{p.name_en ? <span className="font-normal text-muted-foreground"> · {p.name_en}</span> : null}</div>
          <div className="text-[13px] text-muted-foreground">{[p.title_th, p.title_en].filter(Boolean).join(" · ") || "No title"}</div>
        </div>
        {!drawing && (
          <Button type="button" variant="outline" size="sm" onClick={() => { setDrawing(true); setState({}); }}>
            <PenLine /> {p.signature_image ? "Redraw signature" : "Draw signature"}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${p.name_th}`}
          disabled={pending}
          onClick={() => confirm(`Remove ${p.name_th}? Issued documents keep their copy.`) && start(async () => { await deleteSignatory(p.id); })}
        >
          <Trash2 />
        </Button>
      </div>
      {drawing && (
        <div className="space-y-2">
          <SignaturePad onChange={setPng} label={`Signature of ${p.name_th}`} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" disabled={!png || pending}
              onClick={() => start(async () => {
                const r = await updateSignature(p.id, png!);
                setState(r);
                if (!r.error) setDrawing(false);
              })}>
              {pending ? "Saving…" : "Save signature"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDrawing(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <FormMessage state={state} />
    </li>
  );
}

/** The add form, remounted after each new person so it starts empty. */
function AddSignatory() {
  const [state, action] = useActionState<FormState, FormData>(addSignatory, {});
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [png, setPng] = useState<string | null>(null);
  const e = state.fieldErrors ?? {};
  const dv = (k: string) => state.values?.[k] ?? "";
  return (
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

      <fieldset className="grid gap-2 sm:col-span-2">
        <legend className="mb-1.5 text-[13px] font-medium">Signature</legend>
        <div className="inline-flex w-fit rounded-md border border-input bg-card p-0.5">
          {([["draw", "Draw", PenLine], ["upload", "Upload image", Upload]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm", mode === k ? "bg-cobalt font-medium text-white" : "hover:bg-secondary")}>
              <Icon className="size-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
        {mode === "draw" ? (
          <>
            <SignaturePad onChange={setPng} />
            <input type="hidden" name="signature_drawn" value={png ?? ""} />
            <p className="text-[12px] text-muted-foreground">Saved as a transparent PNG and printed above the signer&apos;s name. Optional.</p>
          </>
        ) : (
          <Field label="Signature image" htmlFor="sg_signature" hint="PNG or JPEG under 250 KB. A transparent PNG looks best.">
            <Input id="sg_signature" name="signature" type="file" accept="image/png,image/jpeg" />
          </Field>
        )}
      </fieldset>

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>Add signatory</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function Signatories({ people }: { people: Tables<"signatories">[] }) {
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
            {people.map((p) => <Person key={p.id} p={p} />)}
          </ul>
        )}
        <AddSignatory key={people.length} />
      </CardContent>
    </Card>
  );
}
