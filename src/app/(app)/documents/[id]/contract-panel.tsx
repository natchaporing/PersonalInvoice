"use client";

import { FileSignature } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { createContract } from "../../contracts/actions";

/** On a quotation: its contracts, and a button to make one. */
export function ContractPanel({ quotationId, issued, contracts }: { quotationId: string; issued: boolean; contracts: { id: string; number: string; status: string }[] }) {
  const t = useMessages().contracts;
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  const active = contracts.some((c) => c.status !== "void");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.panelTitle}</CardTitle>
        <CardDescription>{t.panelNote}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {contracts.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3">
            <Link href={`/contracts/${c.id}`} className="num font-medium text-cobalt hover:underline">{c.number}</Link>
            <span className={cn(c.status === "signed" ? "text-ok" : c.status === "void" ? "text-destructive" : "text-muted-foreground")}>{t.status[c.status]}</span>
          </div>
        ))}
        {!active &&
          (issued ? (
            <div>
              <Button disabled={pending} onClick={() => start(async () => setState((await createContract(quotationId)) ?? {}))}>
                <FileSignature /> {t.create}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">{t.onlyIssued}</p>
          ))}
        <FormMessage state={state} />
      </CardContent>
    </Card>
  );
}
