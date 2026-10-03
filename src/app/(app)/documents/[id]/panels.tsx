"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { formatTHB } from "@/lib/thai/money";
import { addWhtCertificate, recordPayment } from "../actions";

export interface PaymentRow { id: string; paid_on: string; amount: number; method: string; reference: string | null; slipUrl: string | null }
export interface CertRow { id: string; certificate_no: string | null; issued_on: string; wht_amount: number; income_amount: number; fileUrl: string | null }

const METHODS = ["transfer", "cheque", "cash", "other"];

export function PaymentsPanel({
  documentId, payments, netReceivable, paid, today, open,
}: { documentId: string; payments: PaymentRow[]; netReceivable: number; paid: number; today: string; open: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(recordPayment.bind(null, documentId), {});
  const e = state.fieldErrors ?? {};
  const dv = (k: string, fallback: string) => state.values?.[k] ?? fallback;
  const balance = Math.max(0, netReceivable - paid);
  const m = useMessages();
  const t = m.docs.payments;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription className="num">
          {t.received(formatTHB(paid), formatTHB(netReceivable), formatTHB(balance))}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {payments.length > 0 && (
          <ul className="divide-y rounded-md border">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                <span>{p.paid_on} · {m.payments.method[p.method] ?? p.method}{p.reference && ` · ${p.reference}`}</span>
                <span className="flex items-baseline gap-3">
                  {p.slipUrl && <a href={p.slipUrl} target="_blank" rel="noreferrer" className="text-cobalt underline">{t.slip}</a>}
                  <span className="num">฿{formatTHB(p.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {open && (
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <Field label={t.date} htmlFor="paid_on" error={e.paid_on}>
              <Input id="paid_on" name="paid_on" type="date" defaultValue={dv("paid_on", today)} />
            </Field>
            <Field label={t.amount} htmlFor="amount" error={e.amount}>
              <Input id="amount" name="amount" inputMode="decimal" className="num text-right" defaultValue={dv("amount", (balance / 100).toFixed(2))} />
            </Field>
            <Field label={t.method} htmlFor="method" error={e.method}>
              <NativeSelect id="method" name="method" defaultValue={dv("method", "transfer")}>
                {METHODS.map((k) => <option key={k} value={k}>{m.payments.method[k]}</option>)}
              </NativeSelect>
            </Field>
            <Field label={t.reference} htmlFor="reference" error={e.reference} hint={t.referenceHint}>
              <Input id="reference" name="reference" defaultValue={dv("reference", "")} />
            </Field>
            <Field label={t.slipField} htmlFor="slip" className="sm:col-span-2" hint={t.slipHint}>
              <Input id="slip" name="slip" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="h-auto py-1.5" />
            </Field>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <SubmitButton variant="brand">{t.record}</SubmitButton>
            </div>
          </form>
        )}
        <FormMessage state={state} />
      </CardContent>
    </Card>
  );
}

export function WhtPanel({
  documentId, certificates, expectedWht, taxable, today,
}: { documentId: string; certificates: CertRow[]; expectedWht: number; taxable: number; today: string }) {
  const [state, action] = useActionState<FormState, FormData>(addWhtCertificate.bind(null, documentId), {});
  const e = state.fieldErrors ?? {};
  const dv = (k: string, fallback: string) => state.values?.[k] ?? fallback;
  const received = certificates.reduce((s, c) => s + c.wht_amount, 0);
  const t = useMessages().docs.wht;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription className="num">
          {t.expected(formatTHB(expectedWht), formatTHB(received))}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {certificates.length > 0 && (
          <ul className="divide-y rounded-md border">
            {certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                <span>{c.issued_on}{c.certificate_no && t.no(c.certificate_no)}</span>
                <span className="flex items-baseline gap-3">
                  {c.fileUrl && <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-cobalt underline">{t.file}</a>}
                  <span className="num">฿{formatTHB(c.wht_amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {received < expectedWht && (
          <form action={action} className="grid gap-3 sm:grid-cols-2">
            <Field label={t.date} htmlFor="issued_on" error={e.issued_on}>
              <Input id="issued_on" name="issued_on" type="date" defaultValue={dv("issued_on", today)} />
            </Field>
            <Field label={t.number} htmlFor="certificate_no" error={e.certificate_no}>
              <Input id="certificate_no" name="certificate_no" defaultValue={dv("certificate_no", "")} />
            </Field>
            <Field label={t.income} htmlFor="income_amount" error={e.income_amount}>
              <Input id="income_amount" name="income_amount" inputMode="decimal" className="num text-right" defaultValue={dv("income_amount", (taxable / 100).toFixed(2))} />
            </Field>
            <Field label={t.withheld} htmlFor="wht_amount" error={e.wht_amount}>
              <Input id="wht_amount" name="wht_amount" inputMode="decimal" className="num text-right" defaultValue={dv("wht_amount", ((expectedWht - received) / 100).toFixed(2))} />
            </Field>
            <Field label={t.scan} htmlFor="file" className="sm:col-span-2" hint={t.scanHint}>
              <Input id="file" name="file" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="h-auto py-1.5" />
            </Field>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <SubmitButton variant="brand">{t.save}</SubmitButton>
            </div>
          </form>
        )}
        <FormMessage state={state} />
      </CardContent>
    </Card>
  );
}
