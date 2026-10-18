"use client";

import { Banknote, Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { markCommissionCash, unmarkCommissionPaid } from "../actions";

/** One click on a commission row: paid in cash today, or undo a payment recorded by mistake. */
export function CommissionActions({ id, paid, label }: { id: string; paid: boolean; label: string }) {
  const t = useMessages().payees;
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({});
  return (
    <span className="flex items-center gap-2">
      {paid ? (
        <Button variant="ghost" size="sm" disabled={pending} aria-label={t.undoAria(label)} onClick={() => start(async () => setState(await unmarkCommissionPaid(id)))}>
          <Undo2 /> {t.undo}
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={pending} aria-label={t.cashAria(label)}
          onClick={() => confirm(t.confirmCash(label)) && start(async () => setState(await markCommissionCash(id)))}>
          <Banknote /> {t.paidCash}
        </Button>
      )}
      {state.error && <span role="alert" className="text-[12px] text-destructive">{state.error}</span>}
    </span>
  );
}
