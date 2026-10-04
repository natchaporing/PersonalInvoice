"use client";

import { CheckCircle2, Download, Mail, Printer } from "lucide-react";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormState } from "@/lib/domain/forms";
import { ETAX_EMAIL_CC, etaxMailto } from "@/lib/etax/email";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { markDelivered } from "../actions";

/**
 * A tax document's original reaches the buyer on paper or by e-Tax Invoice by Email; a PDF in an ordinary email is
 * only a copy. This panel walks the seller through either and records which one they used.
 */
export function DeliveryPanel({
  id,
  subject,
  customerEmail,
  pdfUrl,
  deliveredVia,
  deliveredAt,
}: {
  id: string;
  subject: string;
  customerEmail: string | null;
  pdfUrl: string | null;
  deliveredVia: string | null;
  deliveredAt: string | null;
}) {
  const m = useMessages();
  const t = m.docs.delivery;
  const locale = useLocale();
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const mark = (via: "paper" | "etax_email" | null) => start(async () => setState(await markDelivered(id, via)));
  const when = deliveredAt ? new Date(deliveredAt).toLocaleString(locale === "th" ? "th-TH" : "en-GB", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.note}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        {deliveredVia ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-ok">
              <CheckCircle2 className="size-4" aria-hidden /> {deliveredVia === "paper" ? t.donePaper(when) : t.doneEmail(when)}
            </span>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => mark(null)}>{m.actions.undo}</Button>
          </div>
        ) : (
          <>
            <section className="grid gap-2 rounded-md border p-3">
              <h3 className="flex items-center gap-2 font-medium"><Printer className="size-4 text-cobalt" aria-hidden /> {t.paperTitle}</h3>
              <p className="text-muted-foreground">{t.paperHow}</p>
              <div className="flex flex-wrap gap-2">
                {pdfUrl && <Button asChild variant="outline" size="sm"><a href={pdfUrl} target="_blank" rel="noreferrer"><Download /> {t.pdf}</a></Button>}
                <Button type="button" size="sm" disabled={pending} onClick={() => mark("paper")}>{t.markPaper}</Button>
              </div>
            </section>

            <section className="grid gap-2 rounded-md border p-3">
              <h3 className="flex items-center gap-2 font-medium"><Mail className="size-4 text-cobalt" aria-hidden /> {t.emailTitle}</h3>
              <p className="text-muted-foreground">{t.emailWho}</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  {t.step1}{" "}
                  <a href={`/documents/${id}/etax-email`} className="text-cobalt underline underline-offset-4" download>{t.downloadPdfa}</a>
                </li>
                <li>
                  {t.step2}{" "}
                  <a href={etaxMailto(customerEmail, subject, t.body)} className="text-cobalt underline underline-offset-4">{t.openEmail}</a>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
                    <dt className="text-muted-foreground">{t.to}</dt>
                    <dd className="break-all">{customerEmail ?? t.noEmail}</dd>
                    <dt className="text-muted-foreground">CC</dt>
                    <dd className="font-mono break-all">{ETAX_EMAIL_CC}</dd>
                    <dt className="text-muted-foreground">{t.subject}</dt>
                    <dd className="font-mono break-all">{subject}</dd>
                  </dl>
                </li>
                <li>{t.step3}</li>
              </ol>
              <div>
                <Button type="button" size="sm" disabled={pending} onClick={() => mark("etax_email")}>{t.markEmail}</Button>
              </div>
            </section>
          </>
        )}
        <FormMessage state={state} />
      </CardContent>
    </Card>
  );
}
