"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, signUp } from "@/app/login/actions";
import { ResendConfirmation } from "@/app/login/resend";
import { TRIAL_DAYS } from "@/lib/domain/billing";

function FieldError({ id, state }: { id: string; state: AuthState }) {
  if (state.field !== id || !state.error) return null;
  return <p id={`${id}-error`} role="alert" className="text-[12px] text-destructive">{state.error}</p>;
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
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
        <Link href="/login" className="text-sm text-cobalt underline-offset-4 hover:underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid h-fit gap-4" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" defaultValue={v("name")} placeholder="ณัฐชา ใจดี" required {...invalid("name")} />
        <p className="text-[12px] text-muted-foreground">As it should appear on your documents. You can add an English name later.</p>
        <FieldError id="name" state={state} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="taxId">Personal tax ID</Label>
        <Input id="taxId" name="taxId" inputMode="numeric" autoComplete="off" maxLength={17} className="num" defaultValue={v("taxId")} placeholder="13 digits" required {...invalid("taxId")} />
        <p className="text-[12px] text-muted-foreground">Your 13-digit national ID number, the one you registered for VAT with.</p>
        <FieldError id="taxId" state={state} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required {...invalid("email")} />
        <FieldError id="email" state={state} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirmEmail">Confirm email</Label>
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
        {mismatch && <p id="confirmEmail-mismatch" className="text-[12px] text-destructive">The two email addresses don&apos;t match</p>}
        {!mismatch && <FieldError id="confirmEmail" state={state} />}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required {...invalid("password")} />
        <p className="text-[12px] text-muted-foreground">At least 8 characters.</p>
        <FieldError id="password" state={state} />
      </div>
      <div className="grid gap-1">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 size-4 accent-[var(--cobalt)]" {...invalid("terms")} />
          <span>
            I agree to the <Link href="/terms" target="_blank" className="text-cobalt underline">terms of service</Link> and the{" "}
            <Link href="/terms#privacy" target="_blank" className="text-cobalt underline">privacy notice</Link>.
          </span>
        </label>
        <FieldError id="terms" state={state} />
      </div>
      {state.error && !state.field && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending || mismatch} className="mt-1">{pending ? "Please wait…" : `Start my ${TRIAL_DAYS}-day free trial`}</Button>
      <p className="text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="font-medium text-cobalt underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
