"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, signUp } from "@/app/login/actions";
import { ResendConfirmation } from "@/app/login/resend";
import { TRIAL_DAYS } from "@/lib/domain/billing";
import { useMessages } from "@/lib/i18n/client";

function FieldError({ id, state }: { id: string; state: AuthState }) {
  if (state.field !== id || !state.error) return null;
  return <p id={`${id}-error`} role="alert" className="text-[12px] text-destructive">{state.error}</p>;
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  const m = useMessages();
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const mismatch = confirmEmail !== "" && email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase();
  const v = (k: string) => state.values?.[k] ?? "";
  const invalid = (k: string) => (state.field === k ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  if (state.message) {
    return (
      <div className="grid h-fit gap-3">
        <p role="status" className="rounded-md border border-ok/40 bg-ok/5 px-3 py-3 text-sm text-ok">{state.message}</p>
        {state.pendingEmail && <ResendConfirmation email={state.pendingEmail} />}
        <Link href="/login" className="text-sm text-cobalt underline-offset-4 hover:underline">{m.auth.backToSignIn}</Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid h-fit gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="name">{m.auth.name}</Label>
        <Input id="name" name="name" autoComplete="name" defaultValue={v("name")} placeholder={m.auth.namePlaceholder} required {...invalid("name")} />
        <p className="text-[12px] text-muted-foreground">{m.auth.nameHint}</p>
        <FieldError id="name" state={state} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="taxId">{m.auth.taxId}</Label>
        <Input id="taxId" name="taxId" inputMode="numeric" autoComplete="off" maxLength={17} className="num" defaultValue={v("taxId")} placeholder={m.auth.taxIdPlaceholder} required {...invalid("taxId")} />
        <p className="text-[12px] text-muted-foreground">{m.auth.taxIdHint}</p>
        <FieldError id="taxId" state={state} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">{m.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required {...invalid("email")} />
        <FieldError id="email" state={state} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirmEmail">{m.auth.confirmEmail}</Label>
        <Input
          id="confirmEmail"
          name="confirmEmail"
          type="email"
          autoComplete="off"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          onPaste={(e) => e.preventDefault()} // retype it, that's the point
          aria-invalid={mismatch || state.field === "confirmEmail"}
          aria-describedby={mismatch ? "confirmEmail-mismatch" : undefined}
          required
        />
        {mismatch && <p id="confirmEmail-mismatch" className="text-[12px] text-destructive">{m.auth.emailsDiffer}</p>}
        {!mismatch && <FieldError id="confirmEmail" state={state} />}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">{m.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required {...invalid("password")} />
        <p className="text-[12px] text-muted-foreground">{m.auth.passwordHint}</p>
        <FieldError id="password" state={state} />
      </div>
      <div className="grid gap-1">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-[var(--cobalt)]" {...invalid("terms")} />
          <span>
            {m.auth.agreeBefore} <Link href="/terms" target="_blank" className="text-cobalt underline">{m.auth.termsLink}</Link> {m.auth.agreeAnd}{" "}
            <Link href="/terms#privacy" target="_blank" className="text-cobalt underline">{m.auth.privacyLink}</Link>
          </span>
        </label>
        <FieldError id="terms" state={state} />
      </div>
      {state.error && !state.field && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending || mismatch} className="mt-1">{pending ? m.auth.wait : m.common.startTrial(TRIAL_DAYS)}</Button>
      <p className="text-sm text-muted-foreground">
        {m.auth.haveAccount} <Link href="/login" className="font-medium text-cobalt underline-offset-4 hover:underline">{m.common.signIn}</Link>
      </p>
    </form>
  );
}
