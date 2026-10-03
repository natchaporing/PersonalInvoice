"use client";

import { Copy, Download, FileCheck2, FilePen, FileMinus, FilePlus, Printer, RefreshCw, Send, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import type { DocStatus, DocType } from "@/lib/domain/documents";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { deleteDraft, issueDocument, regeneratePdf, voidDocument } from "../actions";
import { createReceiptFromInvoice } from "../installment-actions";

export function DocumentActions({
  id,
  status,
  type,
  pdfUrl,
  canAdjust,
  hasPayments,
  receipt,
}: {
  id: string;
  status: DocStatus;
  type: DocType;
  pdfUrl: string | null;
  canAdjust: boolean;
  hasPayments: boolean;
  /** Invoices: the receipt/tax invoice issued for it (null = none yet, undefined = not applicable). */
  receipt?: { id: string; number: string | null } | null;
}) {
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const t = useMessages().docs.actions;
  const run = (fn: () => Promise<FormState | void>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setState({});
    start(async () => {
      const r = await fn();
      if (r) setState(r);
    });
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <>
            <Button disabled={pending} onClick={() => run(() => issueDocument(id), t.confirmIssue)}>
              <Send /> {pending ? t.working : t.issue}
            </Button>
            <Button asChild variant="outline"><Link href={`/documents/${id}/edit`}><FilePen /> {t.edit}</Link></Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => run(() => deleteDraft(id), t.confirmDeleteDraft)}>
              <Trash2 /> {t.deleteDraft}
            </Button>
          </>
        )}
        {status !== "draft" && (
          <>
            {pdfUrl ? (
              <Button asChild><a href={pdfUrl}><Download /> {t.signedPdf}</a></Button>
            ) : (
              <Button disabled={pending} onClick={() => run(() => regeneratePdf(id))}><RefreshCw /> {pending ? t.signing : t.generatePdf}</Button>
            )}
            <Button asChild variant="outline"><a href={`/print/documents/${id}`} target="_blank" rel="noreferrer"><Printer /> {t.print}</a></Button>
            {receipt === null && (
              <Button variant="brand" disabled={pending}
                onClick={() => run(() => createReceiptFromInvoice(id), status === "paid" ? undefined : t.confirmReceipt)}>
                <FileCheck2 /> {t.receipt}
              </Button>
            )}
            {canAdjust && status !== "void" && (
              <>
                <Button asChild variant="outline"><Link href={`/documents/new?type=credit_note&ref=${id}`}><FileMinus /> {t.creditNote}</Link></Button>
                <Button asChild variant="outline"><Link href={`/documents/new?type=debit_note&ref=${id}`}><FilePlus /> {t.debitNote}</Link></Button>
              </>
            )}
            {status === "issued" && !hasPayments && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending}
                onClick={() => run(() => voidDocument(id), t.confirmVoid)}>
                <XCircle /> {t.void}
              </Button>
            )}
          </>
        )}
        <Button asChild variant="ghost"><Link href={`/documents/new?copy=${id}&type=${type}`}><Copy /> {t.duplicate}</Link></Button>
      </div>
      <FormMessage state={state} />
    </div>
  );
}
