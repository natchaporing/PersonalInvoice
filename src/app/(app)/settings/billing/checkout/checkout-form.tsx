"use client";

import { CreditCard, QrCode } from "lucide-react";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { checkout } from "../actions";

const METHODS = [
  { key: "promptpay", icon: QrCode },
  { key: "card", icon: CreditCard },
] as const;

export function CheckoutForm({ plan, total, testMode }: { plan: string; total: string; testMode: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, {});
  const m = useMessages();
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("promptpay");
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="plan" value={plan} />
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium">{m.billing.payWith}</legend>
        {METHODS.map(({ key, icon: Icon }) => (
          <label
            key={key}
            className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm", method === key ? "border-cobalt bg-accent" : "hover:bg-secondary")}
          >
            <input type="radio" name="method" value={key} checked={method === key} onChange={() => setMethod(key)} className="accent-[var(--cobalt)]" />
            <Icon className="size-4 text-cobalt" aria-hidden />
            <span className="grid">
              <span className="font-medium">{m.billing[key]}</span>
              <span className="text-[12px] text-muted-foreground">{m.billing[`${key}Hint`]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {testMode && (
        <p className="rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-[13px]">
          {m.billing.testMode}
        </p>
      )}
      <Button type="submit" disabled={pending || !testMode}>{pending ? m.billing.processing : testMode ? m.billing.payTest(total) : m.billing.pay(total)}</Button>
      {!testMode && <p className="text-sm text-muted-foreground">{m.billing.notYet}</p>}
      <FormMessage state={state} />
    </form>
  );
}
