"use client";

import { Undo2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { unmarkCommissionPaid } from "../actions";

/** Undo a payment recorded by mistake: the commission goes back to the unpaid list. */
export function CommissionActions({ id, label }: { id: string; label: string }) {
  const t = useMessages().payees;
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({});
  return (
    <span className="flex items-center gap-2">
      <Button variant="ghost" size="sm" disabled={pending} aria-label={t.undoAria(label)} onClick={() => start(async () => setState(await unmarkCommissionPaid(id)))}>
        <Undo2 /> {t.undo}
      </Button>
      {state.error && <span role="alert" className="text-[12px] text-destructive">{state.error}</span>}
    </span>
  );
}
