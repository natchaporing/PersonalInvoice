"use client";

import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { type ContractView, ContractDocument } from "@/components/contract-document";
import { Field, FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { type Clause, defaultClauses } from "@/lib/domain/contracts";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { type ContractDraft, saveContract } from "../actions";

/** Edits a draft contract: dates, place, language and every clause, with the printed contract updating below. */
export function ContractEditor({ id, initial, base }: { id: string; initial: ContractDraft; base: ContractView }) {
  const t = useMessages().contracts;
  const [d, setD] = useState<ContractDraft>(initial);
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const set = <K extends keyof ContractDraft>(k: K, v: ContractDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setClause = (i: number, patch: Partial<Clause>) => set("clauses", d.clauses.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, by: number) => {
    const next = [...d.clauses];
    const [c] = next.splice(i, 1);
    next.splice(i + by, 0, c);
    set("clauses", next);
  };
  const view: ContractView = { ...base, lang: d.lang, contractDate: d.contract_date, place: d.place, start: d.start_date, end: d.end_date, clauses: d.clauses };
  const opt = (v: string) => (v.trim() === "" ? null : v);

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t.contractDate} htmlFor="contract_date">
            <Input id="contract_date" type="date" value={d.contract_date} onChange={(e) => set("contract_date", e.target.value)} />
          </Field>
          <Field label={t.start} htmlFor="start_date">
            <Input id="start_date" type="date" value={d.start_date ?? ""} onChange={(e) => set("start_date", opt(e.target.value))} />
          </Field>
          <Field label={t.end} htmlFor="end_date">
            <Input id="end_date" type="date" value={d.end_date ?? ""} onChange={(e) => set("end_date", opt(e.target.value))} />
          </Field>
          <Field label={t.place} htmlFor="place" hint={t.placeHint}>
            <Input id="place" value={d.place ?? ""} onChange={(e) => set("place", opt(e.target.value))} />
          </Field>
          <Field label={t.lang} htmlFor="lang">
            <select id="lang" className="h-9 rounded-md border bg-card px-2 text-sm" value={d.lang} onChange={(e) => set("lang", e.target.value as ContractDraft["lang"])}>
              {(["th", "bilingual", "en"] as const).map((l) => <option key={l} value={l}>{t.langs[l]}</option>)}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.clauses}</CardTitle>
          <p className="text-[13px] text-muted-foreground">{t.tokensHint}</p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {d.clauses.map((c, i) => (
            <details key={i} className="rounded-md border bg-card" open={i === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-medium">
                <span>{t.clauseN(i + 1)}. {c.title_th}</span>
              </summary>
              <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
                <Field label={t.titleTh} htmlFor={`ct${i}`}><Input id={`ct${i}`} value={c.title_th} onChange={(e) => setClause(i, { title_th: e.target.value })} /></Field>
                <Field label={t.titleEn} htmlFor={`ce${i}`}><Input id={`ce${i}`} value={c.title_en} onChange={(e) => setClause(i, { title_en: e.target.value })} /></Field>
                <Field label={t.bodyTh} htmlFor={`bt${i}`}><Textarea id={`bt${i}`} rows={5} value={c.body_th} onChange={(e) => setClause(i, { body_th: e.target.value })} /></Field>
                <Field label={t.bodyEn} htmlFor={`be${i}`}><Textarea id={`be${i}`} rows={5} value={c.body_en} onChange={(e) => setClause(i, { body_en: e.target.value })} /></Field>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /> {t.moveUp}</Button>
                  <Button type="button" size="sm" variant="ghost" disabled={i === d.clauses.length - 1} onClick={() => move(i, 1)}><ArrowDown /> {t.moveDown}</Button>
                  <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={d.clauses.length <= 1}
                    onClick={() => set("clauses", d.clauses.filter((_, j) => j !== i))}><Trash2 /> {t.removeClause}</Button>
                </div>
              </div>
            </details>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => set("clauses", [...d.clauses, { title_th: "", title_en: "", body_th: "", body_en: "" }])}><Plus /> {t.addClause}</Button>
            <Button type="button" variant="ghost" onClick={() => confirm(t.confirmReset) && set("clauses", defaultClauses(base.facts))}><RotateCcw /> {t.reset}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-md border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
        <Button type="button" disabled={pending} onClick={() => start(async () => setState(await saveContract(id, d)))}>{pending ? "…" : t.save}</Button>
        <FormMessage state={state} />
      </div>

      <div className="overflow-x-auto rounded-md border bg-white shadow-sm">
        <ContractDocument c={view} />
      </div>
    </div>
  );
}
