"use client";

import { Copy, Download, FilePen, PenLine, Printer, Send, Trash2, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { deleteContract, markSignedOnPaper, reopenContract, sendContract, voidContract } from "../actions";

export function ContractActions({ id, status, signUrl, today }: { id: string; status: string; signUrl: string | null; today: string }) {
  const t = useMessages().contracts;
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const [paperDate, setPaperDate] = useState(today);
  const [copied, setCopied] = useState(false);
  const run = (fn: () => Promise<FormState>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setState({});
    start(async () => setState(await fn()));
  };
  const open = status === "draft" || status === "sent";

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><a href={`/print/contracts/${id}`} target="_blank" rel="noreferrer"><Printer /> {t.print}</a></Button>
        <Button asChild variant="outline"><a href={`/contracts/${id}/pdf`} download><Download /> {t.pdf}</a></Button>
        {status === "draft" && <Button disabled={pending} onClick={() => run(() => sendContract(id), t.confirmSend)}><Send /> {t.send}</Button>}
        {status === "sent" && <Button variant="outline" disabled={pending} onClick={() => run(() => reopenContract(id), t.confirmReopen)}><FilePen /> {t.reopen}</Button>}
        {(status === "sent" || status === "signed") && (
          <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => run(() => voidContract(id), t.confirmVoid)}><XCircle /> {t.void}</Button>
        )}
        {status === "draft" && (
          <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={pending} onClick={() => run(() => deleteContract(id), t.confirmDelete)}><Trash2 /> {t.delete}</Button>
        )}
      </div>

      {status === "sent" && signUrl && (
        <div className="grid gap-1.5 rounded-md border border-cobalt/30 bg-accent px-3 py-2.5 text-sm">
          <div className="font-medium">{t.link}</div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-card px-2 py-1 text-[12px]">{signUrl}</code>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(signUrl).then(() => setCopied(true))}><Copy /> {copied ? t.copied : t.copy}</Button>
          </div>
          <p className="text-[12px] text-muted-foreground">{t.linkNote}</p>
        </div>
      )}

      {open && (
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label className="grid gap-1">
            <span className="text-[12px] text-muted-foreground">{t.signedPaperDate}</span>
            <Input type="date" value={paperDate} onChange={(e) => setPaperDate(e.target.value)} className="w-44" />
          </label>
          <Button variant="outline" disabled={pending} onClick={() => run(() => markSignedOnPaper(id, paperDate), t.confirmPaper)}><PenLine /> {t.signedPaper}</Button>
        </div>
      )}
      <FormMessage state={state} />
    </div>
  );
}
