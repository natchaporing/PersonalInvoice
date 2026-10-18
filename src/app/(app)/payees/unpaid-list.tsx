"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Field, FormMessage } from "@/components/form";
import { Qr } from "@/components/qr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { formatTHB } from "@/lib/thai/money";
import { formatPromptPay, isPromptPayId, promptPayPayload } from "@/lib/thai/promptpay";
import { payCommissions } from "./actions";
import type { UnpaidRow } from "./unpaid";

/** Unpaid commissions by quotation: tick any number of them and record one payment for all. */
export function UnpaidList({ rows, today, showPayee = true }: { rows: UnpaidRow[]; today: string; showPayee?: boolean }) {
  const t = useMessages().payees;
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [paidOn, setPaidOn] = useState(today);
  const [method, setMethod] = useState<"transfer" | "promptpay" | "cash">("transfer");
  const [reference, setReference] = useState("");
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();

  const chosen = rows.filter((r) => picked.has(r.id));
  const total = chosen.reduce((s, r) => s + r.net, 0);
  const all = rows.length > 0 && chosen.length === rows.length;
  // One payee, one PromptPay: a single QR for everything ticked.
  const onePayee = new Set(chosen.map((r) => r.payeeId)).size === 1;
  const promptpay = onePayee && chosen[0].promptpay && isPromptPayId(chosen[0].promptpay) ? chosen[0].promptpay : null;
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const pay = () =>
    start(async () => {
      const res = await payCommissions({ ids: chosen.map((r) => r.id), paid_on: paidOn, method, reference });
      setState(res);
      if (!res.error) { setPicked(new Set()); setReference(""); }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.unpaidTitle}</CardTitle>
        <CardDescription>{rows.length ? t.unpaidNote(rows.length, formatTHB(rows.reduce((s, r) => s + r.net, 0))) : t.unpaidNone}</CardDescription>
      </CardHeader>
      {rows.length === 0 && state.message && <CardContent><FormMessage state={state} /></CardContent>}
      {rows.length > 0 && (
        <CardContent className="space-y-4 text-sm">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full">
              <thead className="text-left text-[12px] text-muted-foreground">
                <tr className="border-b">
                  <th className="w-10 px-3 py-2"><input type="checkbox" aria-label={t.selectAll} className="size-4 accent-[var(--cobalt)]" checked={all} onChange={() => setPicked(all ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
                  <th className="px-2 py-2 font-medium">{t.quotation}</th>
                  {showPayee && <th className="px-2 py-2 font-medium">{t.colName}</th>}
                  <th className="hidden px-2 py-2 font-medium sm:table-cell">{t.colCustomer}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.colToTransfer}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2"><input type="checkbox" aria-label={t.selectRow(r.number ?? t.quotation, r.payeeName)} className="size-4 accent-[var(--cobalt)]" checked={picked.has(r.id)} onChange={() => toggle(r.id)} /></td>
                    <td className="px-2 py-2">
                      <Link href={`/documents/${r.quotationId}`} className="num text-cobalt hover:underline">{r.number ?? t.quotation}</Link>
                      {r.issueDate && <div className="num text-[12px] text-muted-foreground">{r.issueDate}</div>}
                    </td>
                    {showPayee && <td className="px-2 py-2">{r.payeeId ? <Link href={`/payees/${r.payeeId}`} className="hover:underline">{r.payeeName}</Link> : r.payeeName}</td>}
                    <td className="hidden px-2 py-2 text-muted-foreground sm:table-cell">{r.customer ?? "—"}</td>
                    <td className="num px-3 py-2 text-right font-medium">{formatTHB(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <div className="num font-medium">{chosen.length ? t.selected(chosen.length, formatTHB(total)) : t.selectHint}</div>
            <div className="flex flex-wrap items-end gap-2">
              <Field label={t.paidOn} htmlFor="pay_on">
                <Input id="pay_on" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="w-40" />
              </Field>
              <Field label={t.method} htmlFor="pay_method">
                <NativeSelect id="pay_method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                  <option value="transfer">{t.methodTransfer}</option>
                  <option value="promptpay">{t.promptPay}</option>
                  <option value="cash">{t.methodCash}</option>
                </NativeSelect>
              </Field>
              <Field label={t.reference} htmlFor="pay_ref">
                <Input id="pay_ref" value={reference} onChange={(e) => setReference(e.target.value)} className="w-44" />
              </Field>
              <Button type="button" disabled={!chosen.length || pending} onClick={pay}>{pending ? t.paying : t.payButton(chosen.length)}</Button>
            </div>
            {method === "promptpay" && chosen.length > 0 && (
              promptpay ? (
                <div className="flex items-center gap-3 rounded-md border bg-white p-3 text-[13px] text-[#1a2536]">
                  <Qr value={promptPayPayload(promptpay, total)} size={148} label={`PromptPay ${formatPromptPay(promptpay)} ฿${formatTHB(total)}`} />
                  <div>
                    <div className="font-semibold">{chosen[0].payeeName}</div>
                    <div className="num">{t.promptPay} {formatPromptPay(promptpay)}</div>
                    <div className="num mt-1 text-[15px] font-semibold">฿{formatTHB(total)}</div>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">{t.qrOnePayee}</p>
              )
            )}
            <FormMessage state={state} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
