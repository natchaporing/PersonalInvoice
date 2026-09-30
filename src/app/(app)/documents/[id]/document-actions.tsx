"use client";

import { Copy, Download, FileCheck2, FilePen, FileMinus, FilePlus, Printer, RefreshCw, Send, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import type { DocStatus, DocType } from "@/lib/domain/documents";
import type { FormState } from "@/lib/domain/forms";
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
            <Button disabled={pending} onClick={() => run(() => issueDocument(id), "Issue this document? It gets the next number and can no longer be edited.")}>
              <Send /> {pending ? "Working…" : "Issue & sign"}
            </Button>
            <Button asChild variant="outline"><Link href={`/documents/${id}/edit`}><FilePen /> Edit</Link></Button>
            <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => run(() => deleteDraft(id), "Delete this draft?")}>
              <Trash2 /> Delete draft
            </Button>
          </>
        )}
        {status !== "draft" && (
          <>
            {pdfUrl ? (
              <Button asChild><a href={pdfUrl}><Download /> Signed PDF</a></Button>
            ) : (
              <Button disabled={pending} onClick={() => run(() => regeneratePdf(id))}><RefreshCw /> {pending ? "Signing…" : "Generate signed PDF"}</Button>
            )}
            <Button asChild variant="outline"><a href={`/print/documents/${id}`} target="_blank" rel="noreferrer"><Printer /> Print</a></Button>
            {receipt === null && (
              <Button variant="brand" disabled={pending}
                onClick={() => run(() => createReceiptFromInvoice(id), status === "paid" ? undefined : "This invoice is not marked paid yet. Create the receipt/tax invoice anyway?")}>
                <FileCheck2 /> Receipt / tax invoice
              </Button>
            )}
            {canAdjust && status !== "void" && (
              <>
                <Button asChild variant="outline"><Link href={`/documents/new?type=credit_note&ref=${id}`}><FileMinus /> Credit note</Link></Button>
                <Button asChild variant="outline"><Link href={`/documents/new?type=debit_note&ref=${id}`}><FilePlus /> Debit note</Link></Button>
              </>
            )}
            {status === "issued" && !hasPayments && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending}
                onClick={() => run(() => voidDocument(id), "Void this document? The number stays used and the document is kept on record as void.")}>
                <XCircle /> Void
              </Button>
            )}
          </>
        )}
        <Button asChild variant="ghost"><Link href={`/documents/new?copy=${id}&type=${type}`}><Copy /> Duplicate</Link></Button>
      </div>
      <FormMessage state={state} />
    </div>
  );
}
