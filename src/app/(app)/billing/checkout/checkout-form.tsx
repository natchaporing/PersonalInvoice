"use client";

import { CreditCard, QrCode } from "lucide-react";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/domain/forms";
import { cn } from "@/lib/utils";
import { checkout } from "../actions";

const METHODS = [
  { key: "promptpay", label: "PromptPay QR", th: "พร้อมเพย์", hint: "Scan with any Thai banking app", icon: QrCode },
  { key: "card", label: "Credit or debit card", th: "บัตร", hint: "Visa, Mastercard, JCB", icon: CreditCard },
] as const;

export function CheckoutForm({ plan, total, testMode }: { plan: string; total: string; testMode: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, {});
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("promptpay");
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="plan" value={plan} />
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium">Pay with</legend>
        {METHODS.map(({ key, label, th, hint, icon: Icon }) => (
          <label
            key={key}
            className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm", method === key ? "border-cobalt bg-accent" : "hover:bg-secondary")}
          >
            <input type="radio" name="method" value={key} checked={method === key} onChange={() => setMethod(key)} className="accent-[var(--cobalt)]" />
            <Icon className="size-4 text-cobalt" aria-hidden />
            <span className="grid">
              <span className="font-medium">{label} <span className="font-normal text-muted-foreground">· {th}</span></span>
              <span className="text-[12px] text-muted-foreground">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {testMode && (
        <p className="rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-[13px]">
          Test mode: no money moves. Paying here activates the plan straight away, as a real payment would.
        </p>
      )}
      <Button type="submit" disabled={pending || !testMode}>{pending ? "Processing…" : `Pay ${total}${testMode ? " (test)" : ""}`}</Button>
      {!testMode && <p className="text-sm text-muted-foreground">Online payment isn&apos;t switched on yet.</p>}
      <FormMessage state={state} />
    </form>
  );
}
