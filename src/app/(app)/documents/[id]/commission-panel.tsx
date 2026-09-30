"use client";

import { Trash2, Undo2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { commissionFigures } from "@/lib/domain/installments";
import type { Tables } from "@/lib/supabase/database.types";
import { formatTHB, thbToSatang } from "@/lib/thai/money";
import { addCommission, deleteCommission, markCommissionPaid, undoCommissionPaid } from "../installment-actions";

const WHT = [
  { bps: 0, label: "No withholding" },
  { bps: 300, label: "3% (individual, service/commission)" },
  { bps: 100, label: "1%" },
  { bps: 200, label: "2%" },
  { bps: 500, label: "5%" },
];

function PaidForm({ id, today }: { id: string; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(markCommissionPaid.bind(null, id), {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <Field label="Transferred on" htmlFor={`paid-${id}`} error={state.fieldErrors?.paid_on}>
        <Input id={`paid-${id}`} name="paid_on" type="date" defaultValue={today} className="w-40" />
      </Field>
      <Field label="Reference" htmlFor={`ref-${id}`}>
        <Input id={`ref-${id}`} name="paid_reference" className="w-44" />
      </Field>
      <SubmitButton variant="outline">Mark transferred</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/** Commission owed on a quotation: internal bookkeeping only, never printed on any document. */
export function CommissionPanel({ quotationId, taxable, rows, today }: { quotationId: string; taxable: number; rows: Tables<"commissions">[]; today: string }) {
  const [msg, setMsg] = useState<FormState>({});
  const [pending, start] = useTransition();
  const owed = rows.filter((r) => !r.paid_on).reduce((s, r) => s + r.amount - r.wht, 0);
  const paid = rows.filter((r) => r.paid_on).reduce((s, r) => s + r.amount - r.wht, 0);
  const run = (fn: () => Promise<FormState>) => start(async () => setMsg(await fn()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission · ค่านายหน้า</CardTitle>
        <CardDescription>
          For your records only. Nothing here appears on the quotation, invoices or PDFs. Transfer it yourself, then mark it transferred.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {rows.length > 0 && (
          <>
            <div className="num text-muted-foreground">To transfer ฿{formatTHB(owed)} · transferred ฿{formatTHB(paid)}</div>
            <ul className="divide-y rounded-md border">
              {rows.map((r) => (
                <li key={r.id} className="space-y-2 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="font-medium">{r.payee_name}</span>
                      {r.payee_account && <span className="text-muted-foreground"> · {r.payee_account}</span>}
                      <span className="num text-muted-foreground"> · {r.basis === "percent" ? `${(r.rate_bps ?? 0) / 100}% of ฿${formatTHB(taxable)}` : "fixed"}</span>
                    </span>
                    <span className="num">
                      ฿{formatTHB(r.amount)}
                      {r.wht > 0 && <span className="text-muted-foreground"> − WHT ฿{formatTHB(r.wht)} = </span>}
                      {r.wht > 0 && <span className="font-semibold">฿{formatTHB(r.amount - r.wht)}</span>}
                    </span>
                  </div>
                  {r.note && <div className="text-muted-foreground">{r.note}</div>}
                  {r.paid_on ? (
                    <div className="flex flex-wrap items-center gap-2 text-ok">
                      Transferred {r.paid_on}{r.paid_reference && ` · ${r.paid_reference}`}
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => undoCommissionPaid(r.id))}><Undo2 /> Undo</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <PaidForm id={r.id} today={today} />
                      <Button variant="ghost" size="icon" aria-label={`Remove commission for ${r.payee_name}`} disabled={pending}
                        onClick={() => confirm("Remove this commission?") && run(() => deleteCommission(r.id))}>
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
        <CommissionForm key={rows.length} quotationId={quotationId} taxable={taxable} />
      </CardContent>
    </Card>
  );
}

function CommissionForm({ quotationId, taxable }: { quotationId: string; taxable: number }) {
  const [state, action] = useActionState<FormState, FormData>(addCommission.bind(null, quotationId), {});
  const [basis, setBasis] = useState<"percent" | "fixed">("percent");
  const [rate, setRate] = useState("");
  const [fixed, setFixed] = useState("");
  const [whtBps, setWhtBps] = useState(0);
  const e = state.fieldErrors ?? {};
  const preview = commissionFigures({ basis, rateBps: Math.round(Number(rate || 0) * 100), fixed: thbToSatang(Number(fixed.replace(/,/g, "") || 0)), whtBps }, taxable);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Payee" htmlFor="c_payee" error={e.payee_name}>
        <Input id="c_payee" name="payee_name" defaultValue={state.values?.payee_name ?? ""} />
      </Field>
      <Field label="Payee bank account" htmlFor="c_account" hint="Optional, for your transfer">
        <Input id="c_account" name="payee_account" defaultValue={state.values?.payee_account ?? ""} />
      </Field>
      <Field label="Commission is" htmlFor="c_basis">
        <NativeSelect id="c_basis" name="basis" value={basis} onChange={(ev) => setBasis(ev.target.value as "percent" | "fixed")}>
          <option value="percent">% of amount before VAT</option>
          <option value="fixed">Fixed amount</option>
        </NativeSelect>
      </Field>
      {basis === "percent" ? (
        <Field label="Rate (%)" htmlFor="c_rate" error={e.rate}>
          <Input id="c_rate" name="rate" inputMode="decimal" className="num text-right" value={rate} onChange={(ev) => setRate(ev.target.value)} />
        </Field>
      ) : (
        <Field label="Amount (THB)" htmlFor="c_fixed" error={e.fixed}>
          <Input id="c_fixed" name="fixed" inputMode="decimal" className="num text-right" value={fixed} onChange={(ev) => setFixed(ev.target.value)} />
        </Field>
      )}
      <Field label="Withhold when paying" htmlFor="c_wht" hint="Paying an individual a commission usually means withholding 3% and issuing a 50 Tawi.">
        <NativeSelect id="c_wht" name="wht_bps" value={whtBps} onChange={(ev) => setWhtBps(Number(ev.target.value))}>
          {WHT.map((w) => <option key={w.bps} value={w.bps}>{w.label}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Note" htmlFor="c_note">
        <Input id="c_note" name="note" defaultValue={state.values?.note ?? ""} />
      </Field>
      <div className="num text-muted-foreground sm:col-span-2">
        Commission ฿{formatTHB(preview.amount)}{preview.wht > 0 && ` − WHT ฿${formatTHB(preview.wht)}`} · transfer <span className="font-semibold text-foreground">฿{formatTHB(preview.net)}</span>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>Record commission</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
