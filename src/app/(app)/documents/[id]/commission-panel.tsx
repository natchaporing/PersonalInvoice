"use client";

import { ChevronDown, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { commissionFigures } from "@/lib/domain/installments";
import type { Tables } from "@/lib/supabase/database.types";
import { formatTHB, thbToSatang } from "@/lib/thai/money";
import { cn } from "@/lib/utils";
import { addCommission, deleteCommission, markCommissionPaid, undoCommissionPaid } from "../installment-actions";

/** Withholding rates offered for commission, most common first. Labels come from the dictionary. */
const WHT = [0, 300, 100, 200, 500];

function PaidForm({ id, today }: { id: string; today: string }) {
  const t = useMessages().docs.commission;
  const [state, action] = useActionState<FormState, FormData>(markCommissionPaid.bind(null, id), {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <Field label={t.transferredOn} htmlFor={`paid-${id}`} error={state.fieldErrors?.paid_on}>
        <Input id={`paid-${id}`} name="paid_on" type="date" defaultValue={today} className="w-40" />
      </Field>
      <Field label={t.reference} htmlFor={`ref-${id}`}>
        <Input id={`ref-${id}`} name="paid_reference" className="w-44" />
      </Field>
      <SubmitButton variant="outline">{t.markTransferred}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/**
 * Commission owed on a quotation: internal bookkeeping only, never printed on any document.
 * Collapsed by default so it stays out of the way; the header still shows what is left to transfer.
 */
export function CommissionPanel({ quotationId, taxable, rows, today, payees, defaultOpen = false }: { quotationId: string; taxable: number; rows: Tables<"commissions">[]; today: string; payees: Tables<"commission_payees">[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [msg, setMsg] = useState<FormState>({});
  const m = useMessages();
  const t = m.docs.commission;
  const [pending, start] = useTransition();
  const owed = rows.filter((r) => !r.paid_on).reduce((s, r) => s + r.amount - r.wht, 0);
  const paid = rows.filter((r) => r.paid_on).reduce((s, r) => s + r.amount - r.wht, 0);
  const run = (fn: () => Promise<FormState>) => start(async () => setMsg(await fn()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <button type="button" aria-expanded={open} aria-controls="commission-body" onClick={() => setOpen((o) => !o)}
            className="-mx-1 flex w-full items-center justify-between gap-3 rounded px-1 text-left hover:text-cobalt">
            <span>{t.title}</span>
            <span className="flex items-center gap-2 text-[13px] font-normal text-muted-foreground">
              <span className="num">{rows.length ? t.summary(rows.length, formatTHB(owed)) : t.none}</span>
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
            </span>
          </button>
        </CardTitle>
        {open && (
          <CardDescription>
            {t.note}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent id="commission-body" hidden={!open} className="space-y-4 text-sm">
        {rows.length > 0 && (
          <>
            <div className="num text-muted-foreground">{t.totals(formatTHB(owed), formatTHB(paid))}</div>
            <ul className="divide-y rounded-md border">
              {rows.map((r) => (
                <li key={r.id} className="space-y-2 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      {r.payee_id ? <Link href={`/payees/${r.payee_id}`} className="font-medium text-cobalt hover:underline">{r.payee_name}</Link> : <span className="font-medium">{r.payee_name}</span>}
                      {r.payee_account && <span className="text-muted-foreground"> · {r.payee_account}</span>}
                      <span className="num text-muted-foreground"> · {r.basis === "percent" ? t.percentOf((r.rate_bps ?? 0) / 100, formatTHB(taxable)) : t.fixed}</span>
                    </span>
                    <span className="num">
                      ฿{formatTHB(r.amount)}
                      {r.wht > 0 && <span className="text-muted-foreground">{t.minusWht(formatTHB(r.wht))}</span>}
                      {r.wht > 0 && <span className="font-semibold">฿{formatTHB(r.amount - r.wht)}</span>}
                    </span>
                  </div>
                  {r.note && <div className="text-muted-foreground">{r.note}</div>}
                  {r.paid_on ? (
                    <div className="flex flex-wrap items-center gap-2 text-ok">
                      {t.transferred(r.paid_on)}{r.paid_reference && ` · ${r.paid_reference}`}
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => undoCommissionPaid(r.id))}><Undo2 /> {m.actions.undo}</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <PaidForm id={r.id} today={today} />
                      <Button variant="ghost" size="icon" aria-label={t.removeAria(r.payee_name)} disabled={pending}
                        onClick={() => confirm(t.confirmRemove) && run(() => deleteCommission(r.id))}>
                        <Trash2 />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <FormMessage state={msg} />
          </>
        )}

        {/* Remounted after each new commission so the form starts empty. */}
        <CommissionForm key={rows.length} quotationId={quotationId} taxable={taxable} payees={payees} />
      </CardContent>
    </Card>
  );
}

const accountText = (p: Tables<"commission_payees">) => [p.bank_name, p.bank_account_number, p.bank_account_name].filter(Boolean).join(" · ");

function CommissionForm({ quotationId, taxable, payees }: { quotationId: string; taxable: number; payees: Tables<"commission_payees">[] }) {
  const [state, action] = useActionState<FormState, FormData>(addCommission.bind(null, quotationId), {});
  const [payeeId, setPayeeId] = useState("");
  const [name, setName] = useState(state.values?.payee_name ?? "");
  const [account, setAccount] = useState(state.values?.payee_account ?? "");
  const [basis, setBasis] = useState<"percent" | "fixed">("percent");
  const [rate, setRate] = useState("");
  const [fixed, setFixed] = useState("");
  const [whtBps, setWhtBps] = useState(0);
  const e = state.fieldErrors ?? {};
  const t = useMessages().docs.commission;
  const preview = commissionFigures({ basis, rateBps: Math.round(Number(rate || 0) * 100), fixed: thbToSatang(Number(fixed.replace(/,/g, "") || 0)), whtBps }, taxable);
  // Picking a saved payee fills in their details and usual terms; everything stays editable.
  const pick = (id: string) => {
    setPayeeId(id);
    const p = payees.find((x) => x.id === id);
    if (!p) return;
    setName(p.name);
    setAccount(accountText(p));
    setWhtBps(p.default_wht_bps);
    if (p.default_rate_bps) {
      setBasis("percent");
      setRate(String(p.default_rate_bps / 100));
    }
  };
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="payee_id" value={payeeId} />
      <Field label={t.savedPayee} htmlFor="c_profile" className="sm:col-span-2"
        hint={<Link href={`/payees/new?next=${encodeURIComponent(`/documents/${quotationId}?commission=open`)}`} className="text-cobalt underline">{t.newPayee}</Link>}>
        <NativeSelect id="c_profile" value={payeeId} onChange={(ev) => pick(ev.target.value)}>
          <option value="">{t.oneOff}</option>
          {payees.map((p) => <option key={p.id} value={p.id}>{p.name}{p.default_rate_bps ? ` · ${p.default_rate_bps / 100}%` : ""}</option>)}
        </NativeSelect>
      </Field>
      <Field label={t.payee} htmlFor="c_payee" error={e.payee_name}>
        <Input id="c_payee" name="payee_name" value={name} onChange={(ev) => setName(ev.target.value)} />
      </Field>
      <Field label={t.account} htmlFor="c_account" hint={t.accountHint}>
        <Input id="c_account" name="payee_account" value={account} onChange={(ev) => setAccount(ev.target.value)} />
      </Field>
      <Field label={t.basis} htmlFor="c_basis">
        <NativeSelect id="c_basis" name="basis" value={basis} onChange={(ev) => setBasis(ev.target.value as "percent" | "fixed")}>
          <option value="percent">{t.percent}</option>
          <option value="fixed">{t.fixedAmount}</option>
        </NativeSelect>
      </Field>
      {basis === "percent" ? (
        <Field label={t.rate} htmlFor="c_rate" error={e.rate}>
          <Input id="c_rate" name="rate" inputMode="decimal" className="num text-right" value={rate} onChange={(ev) => setRate(ev.target.value)} />
        </Field>
      ) : (
        <Field label={t.amount} htmlFor="c_fixed" error={e.fixed}>
          <Input id="c_fixed" name="fixed" inputMode="decimal" className="num text-right" value={fixed} onChange={(ev) => setFixed(ev.target.value)} />
        </Field>
      )}
      <Field label={t.withhold} htmlFor="c_wht" hint={t.withholdHint}>
        <NativeSelect id="c_wht" name="wht_bps" value={whtBps} onChange={(ev) => setWhtBps(Number(ev.target.value))}>
          {WHT.map((bps) => <option key={bps} value={bps}>{t.wht[bps]}</option>)}
        </NativeSelect>
      </Field>
      <Field label={t.note2} htmlFor="c_note">
        <Input id="c_note" name="note" defaultValue={state.values?.note ?? ""} />
      </Field>
      <div className="num text-muted-foreground sm:col-span-2">
        {t.preview(formatTHB(preview.amount), preview.wht > 0 ? formatTHB(preview.wht) : "")} <span className="font-semibold text-foreground">฿{formatTHB(preview.net)}</span>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>{t.record}</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
