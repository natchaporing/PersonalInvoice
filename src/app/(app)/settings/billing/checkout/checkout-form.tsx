"use client";

import { CreditCard, Lock, QrCode } from "lucide-react";
import Script from "next/script";
import { useActionState, useRef, useState } from "react";
import { FormMessage } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { checkout } from "../actions";

const METHODS = [
  { key: "promptpay", icon: QrCode },
  { key: "card", icon: CreditCard },
] as const;

type OmiseJs = {
  setPublicKey(key: string): void;
  createToken(
    type: "card",
    card: { name: string; number: string; expiration_month: number; expiration_year: number; security_code: string },
    done: (status: number, response: { id?: string; message?: string }) => void,
  ): void;
};
declare global {
  interface Window {
    Omise?: OmiseJs;
  }
}

/** Turns card details into a single-use Opn token in the browser. The card number never reaches Tra's server. */
function cardToken(publicKey: string, card: { name: string; number: string; expiry: string; cvc: string }) {
  return new Promise<string>((resolve, reject) => {
    const omise = window.Omise;
    if (!omise) return reject(new Error("load"));
    const [mm, yy] = card.expiry.split("/").map((s) => s.trim());
    omise.setPublicKey(publicKey);
    omise.createToken(
      "card",
      {
        name: card.name.trim(),
        number: card.number.replace(/\s+/g, ""),
        expiration_month: Number(mm),
        expiration_year: yy?.length === 2 ? 2000 + Number(yy) : Number(yy),
        security_code: card.cvc.trim(),
      },
      (status, res) => (status === 200 && res.id ? resolve(res.id) : reject(new Error(res.message ?? "card"))),
    );
  });
}

export type PayMode = "omise" | "test" | "off";

export function CheckoutForm({ plan, total, mode, omiseKey, omiseTest }: { plan: string; total: string; mode: PayMode; omiseKey: string; omiseTest: boolean }) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(checkout, {});
  const m = useMessages();
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("promptpay");
  const [cardError, setCardError] = useState<string | null>(null);
  const card = useRef<HTMLFieldSetElement>(null);
  const live = mode === "omise";

  const action = async (form: FormData) => {
    setCardError(null);
    if (live && method === "card") {
      // Card inputs have no name, so they are never part of the form data sent to the server.
      const field = (k: string) => card.current?.querySelector<HTMLInputElement>(`[data-card="${k}"]`)?.value ?? "";
      try {
        form.set("omiseToken", await cardToken(omiseKey, { name: field("name"), number: field("number"), expiry: field("expiry"), cvc: field("cvc") }));
      } catch (e) {
        setCardError(e instanceof Error && e.message === "load" ? m.billing.errCardLoad : `${m.billing.errCard}${e instanceof Error && e.message !== "card" ? ` (${e.message})` : ""}`);
        return;
      }
    }
    dispatch(form);
  };

  return (
    <form action={action} className="grid gap-4">
      {live && <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive" />}
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
      {live && method === "card" && (
        <fieldset ref={card} className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">{m.billing.card}</legend>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="card-name">{m.billing.cardName}</Label>
            <Input id="card-name" data-card="name" autoComplete="cc-name" required />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="card-number">{m.billing.cardNumber}</Label>
            <Input id="card-number" data-card="number" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="card-expiry">{m.billing.cardExpiry}</Label>
            <Input id="card-expiry" data-card="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" pattern="\s*\d{1,2}\s*/\s*(\d{2}|\d{4})\s*" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="card-cvc">{m.billing.cardCvc}</Label>
            <Input id="card-cvc" data-card="cvc" inputMode="numeric" autoComplete="cc-csc" pattern="\d{3,4}" required />
          </div>
          <p className="flex gap-2 text-[12px] text-muted-foreground sm:col-span-2">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {m.billing.cardSecure}
          </p>
        </fieldset>
      )}
      {(mode === "test" || (live && omiseTest)) && (
        <p className="rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-[13px]">{live ? m.billing.omiseTest : m.billing.testMode}</p>
      )}
      <Button type="submit" disabled={pending || mode === "off"}>
        {pending ? m.billing.processing : mode === "test" ? m.billing.payTest(total) : m.billing.pay(total)}
      </Button>
      {mode === "off" && <p className="text-sm text-muted-foreground">{m.billing.notYet}</p>}
      {cardError && <p role="alert" className="text-sm text-destructive">{cardError}</p>}
      <FormMessage state={state} />
    </form>
  );
}
