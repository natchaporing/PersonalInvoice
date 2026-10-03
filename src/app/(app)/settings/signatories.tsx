"use client";

import { PenLine, Trash2, Upload, X } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { SignatureDialog } from "@/components/signature-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import type { Tables } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { addSignatory, deleteSignatory, updateSignature } from "./signatory-actions";

function SignatureThumb({ p }: { p: Tables<"signatories"> }) {
  const t = useMessages().signatories;
  return (
    <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded border bg-white">
      {p.signature_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.signature_image} alt={t.signatureOf(p.name_th)} className="max-h-11 max-w-full object-contain" />
      ) : (
        <span className="text-[11px] text-muted-foreground">{t.noImage}</span>
      )}
    </div>
  );
}

/** One person in the list; drawing a new signature happens in a popup. */
function Person({ p }: { p: Tables<"signatories"> }) {
  const [drawing, setDrawing] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const t = useMessages().signatories;
  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-4">
        <SignatureThumb p={p} />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{p.name_th}{p.name_en ? <span className="font-normal text-muted-foreground"> · {p.name_en}</span> : null}</div>
          <div className="text-[13px] text-muted-foreground">{[p.title_th, p.title_en].filter(Boolean).join(" · ") || t.noTitle}</div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setDrawing(true); setState({}); }}>
          <PenLine /> {p.signature_image ? t.redraw : t.draw}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t.remove(p.name_th)}
          disabled={pending}
          onClick={() => confirm(t.confirmRemove(p.name_th)) && start(async () => { await deleteSignatory(p.id); })}
        >
          <Trash2 />
        </Button>
      </div>
      {drawing && (
        <SignatureDialog
          title={t.signatureOf(p.name_th)}
          label={t.signatureOf(p.name_th)}
          confirmLabel={t.saveSignature}
          onClose={() => setDrawing(false)}
          onConfirm={async (png) => {
            const r = await updateSignature(p.id, png);
            setState(r);
            return r.error;
          }}
        />
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
  const [drawing, setDrawing] = useState(false);
  const e = state.fieldErrors ?? {};
  const dv = (k: string) => state.values?.[k] ?? "";
  const m = useMessages();
  const t = m.signatories;
  return (
    <form action={action} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      <Field label={t.nameTh} htmlFor="sg_name_th" error={e.name_th}>
        <Input id="sg_name_th" name="name_th" defaultValue={dv("name_th")} required />
      </Field>
      <Field label={t.nameEn} htmlFor="sg_name_en" error={e.name_en}>
        <Input id="sg_name_en" name="name_en" defaultValue={dv("name_en")} />
      </Field>
      <Field label={t.titleTh} htmlFor="sg_title_th" error={e.title_th}>
        <Input id="sg_title_th" name="title_th" defaultValue={dv("title_th")} />
      </Field>
      <Field label={t.titleEn} htmlFor="sg_title_en" error={e.title_en}>
        <Input id="sg_title_en" name="title_en" defaultValue={dv("title_en")} />
      </Field>

      <fieldset className="grid gap-2 sm:col-span-2">
        <legend className="mb-1.5 text-[13px] font-medium">{t.signature}</legend>
        <div className="inline-flex w-fit rounded-md border border-input bg-card p-0.5">
          {([["draw", t.modeDraw, PenLine], ["upload", t.modeUpload, Upload]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-sm", mode === k ? "bg-cobalt font-medium text-white" : "hover:bg-secondary")}>
              <Icon className="size-3.5" aria-hidden /> {label}
            </button>
          ))}
        </div>
        {mode === "draw" ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-44 items-center justify-center rounded-md border border-input bg-white">
                {png ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={png} alt={t.drawnAlt} className="max-h-14 max-w-full object-contain" />
                ) : (
                  <span className="text-[12px] text-muted-foreground">{t.noSignature}</span>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setDrawing(true)}>
                <PenLine /> {png ? t.redrawShort : t.draw}
              </Button>
              {png && <Button type="button" variant="ghost" size="sm" onClick={() => setPng(null)}><X /> {m.actions.remove}</Button>}
            </div>
            {drawing && <SignatureDialog title={t.drawTitle} onConfirm={setPng} onClose={() => setDrawing(false)} />}
            <input type="hidden" name="signature_drawn" value={png ?? ""} />
            <p className="text-[12px] text-muted-foreground">{t.drawnNote}</p>
          </>
        ) : (
          <Field label={t.image} htmlFor="sg_signature" hint={t.imageHint}>
            <Input id="sg_signature" name="signature" type="file" accept="image/png,image/jpeg" />
          </Field>
        )}
      </fieldset>

      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{t.add}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function Signatories({ people }: { people: Tables<"signatories">[] }) {
  const t = useMessages().signatories;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.note}</CardDescription>
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
