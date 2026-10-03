"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { translateServerText } from "@/lib/i18n/server-text";
import { type InstallmentStage, pctLabel, PLAN_PRESETS, planProblems } from "@/lib/domain/installments";
import { formatTHB } from "@/lib/thai/money";
import { cn } from "@/lib/utils";
import { createInstallmentInvoice, deleteInstallmentPlan, saveInstallmentPlan } from "../installment-actions";

export interface InstallmentRow {
  id: string;
  position: number;
  label: string;
  pctBps: number;
  amount: number;
  stage: InstallmentStage;
  invoice?: { id: string; number: string | null; status: string; total: number };
  receipt?: { id: string; number: string | null; status: string; total: number };
}

const STAGE_CLASS: Record<InstallmentStage, string> = {
  planned: "bg-secondary text-muted-foreground",
  invoiced: "bg-amber/15 text-foreground",
  paid: "bg-cobalt/10 text-cobalt",
  receipted: "bg-ok/10 text-ok",
};

type Draft = { key: string; label: string; pct: string };
const toDraft = (rows: { label: string; pctBps: number }[]): Draft[] => rows.map((r) => ({ key: crypto.randomUUID(), label: r.label, pct: String(r.pctBps / 100) }));

export function InstallmentsPanel({ quotationId, taxable, rows, locked }: { quotationId: string; taxable: number; rows: InstallmentRow[]; locked: boolean }) {
  const [editing, setEditing] = useState(rows.length === 0);
  const [draft, setDraft] = useState<Draft[]>(() => toDraft(rows.length ? rows : PLAN_PRESETS[0].rows));
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const m = useMessages();
  const t = m.docs.installments;
  const locale = useLocale();
  const plan = draft.map((d) => ({ label: d.label, pctBps: Math.round(Number(d.pct.replace(",", ".")) * 100) || 0 }));
  const problems = planProblems(plan);
  const sum = plan.reduce((s, r) => s + r.pctBps, 0);
  const done = rows.filter((r) => r.stage === "receipted").reduce((s, r) => s + r.amount, 0);
  const billed = rows.filter((r) => r.stage !== "planned").reduce((s, r) => s + r.amount, 0);
  const run = (fn: () => Promise<FormState | void>) => {
    setState({});
    start(async () => {
      const r = await fn();
      if (r) setState(r);
      if (r && !r.error) setEditing(false);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.note}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!editing && rows.length > 0 && (
          <>
            <div className="num text-muted-foreground">
              {t.summary(formatTHB(taxable), formatTHB(billed), formatTHB(done), formatTHB(taxable - billed))}
            </div>
            <ol className="divide-y rounded-md border">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
                  <span className="num w-10 text-muted-foreground">{r.position}/{rows.length}</span>
                  <span className="min-w-40 flex-1">
                    <span className="block font-medium">{r.label}</span>
                    <span className="block text-[13px] text-muted-foreground tabular-nums">{t.beforeVat(pctLabel(r.pctBps), formatTHB(r.amount))}</span>
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[12px] font-medium", STAGE_CLASS[r.stage])}>{t.stage[r.stage]}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {r.invoice && <Link href={`/documents/${r.invoice.id}`} className="text-cobalt underline">{r.invoice.number ?? t.draftInvoice}</Link>}
                    {r.receipt && <Link href={`/documents/${r.receipt.id}`} className="text-cobalt underline">{r.receipt.number ?? t.draftReceipt}</Link>}
                    {!r.invoice && (
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => createInstallmentInvoice(r.id))}>
                        {t.createInvoice}
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            {!locked && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setDraft(toDraft(rows)); setEditing(true); }}>{t.change}</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={pending}
                  onClick={() => confirm(t.confirmRemove) && run(() => deleteInstallmentPlan(quotationId))}>
                  {t.remove}
                </Button>
              </div>
            )}
          </>
        )}

        {editing && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PLAN_PRESETS.map((p) => (
                <Button key={p.key} type="button" size="sm" variant="outline" onClick={() => setDraft(toDraft(p.rows))}>{p.name}</Button>
              ))}
            </div>
            {draft.map((d, i) => (
              <div key={d.key} className="grid grid-cols-[1fr_96px_auto] items-end gap-2">
                <label className="grid gap-1 text-[13px]">
                  <span className="font-medium">{t.n(i + 1)}</span>
                  <Input aria-label={t.labelAria(i + 1)} value={d.label} onChange={(e) => setDraft(draft.map((x) => (x.key === d.key ? { ...x, label: e.target.value } : x)))} />
                </label>
                <label className="grid gap-1 text-[13px]">
                  <span className="font-medium">%</span>
                  <Input aria-label={t.pctAria(i + 1)} inputMode="decimal" className="num text-right" value={d.pct} onChange={(e) => setDraft(draft.map((x) => (x.key === d.key ? { ...x, pct: e.target.value } : x)))} />
                </label>
                <Button type="button" variant="ghost" size="icon" aria-label={t.removeAria(i + 1)} disabled={draft.length <= 2}
                  onClick={() => setDraft(draft.filter((x) => x.key !== d.key))}>
                  <X />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="button" size="sm" variant="outline" disabled={draft.length >= 12}
                onClick={() => setDraft([...draft, { key: crypto.randomUUID(), label: "", pct: "" }])}>
                <Plus /> {t.add}
              </Button>
              <span className={cn("num", sum === 10000 ? "text-ok" : "text-destructive")}>{t.total(pctLabel(sum))}</span>
            </div>
            {problems.length > 0 && <p className="text-[13px] text-destructive">{problems.map((p) => translateServerText(p, locale)).join(" ")}</p>}
            <div className="flex gap-2">
              <Button disabled={pending || problems.length > 0} onClick={() => run(() => saveInstallmentPlan(quotationId, plan))}>
                {pending ? m.common.saving : t.save}
              </Button>
              {rows.length > 0 && <Button variant="ghost" onClick={() => setEditing(false)}>{m.actions.cancel}</Button>}
            </div>
          </div>
        )}
        <FormMessage state={state} />
      </CardContent>
    </Card>
  );
}
