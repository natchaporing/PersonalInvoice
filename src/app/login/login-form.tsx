"use client";

import { useActionState, useState } from "react";
import { AuthHash } from "@/components/auth-hash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, resendConfirmation, signIn, signUp } from "./actions";

export function LoginForm({ next, linkFailed }: { next: string; linkFailed?: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const [resendState, resendAction, resendPending] = useActionState<AuthState, FormData>(resendConfirmation, {});

  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;
  const mismatch = mode === "up" && confirmEmail !== "" && email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase();
  // A resend result replaces the message that led here.
  const shown = resendState.message || resendState.error ? resendState : state;
  const pendingEmail = shown.pendingEmail ?? state.pendingEmail;

  return (
    <div className="mt-6 grid gap-4">
      <AuthHash>
        {({ failed }) =>
          (linkFailed || failed) && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              That confirmation link is invalid or has expired. If you already opened it once, your email is confirmed: just sign in. Otherwise sign in below to get a new link.
            </p>
          )
        }
      </AuthHash>

      <form action={mode === "in" ? inAction : upAction} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {mode === "up" && (
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
              aria-invalid={mismatch}
              aria-describedby={mismatch ? "confirmEmail-error" : undefined}
              required
            />
            {mismatch && <p id="confirmEmail-error" className="text-[12px] text-destructive">The two email addresses don&apos;t match</p>}
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} required />
          {mode === "up" && <p className="text-[12px] text-muted-foreground">At least 8 characters.</p>}
        </div>

        {shown.error && <p role="alert" className="text-sm text-destructive">{shown.error}</p>}
        {shown.message && <p role="status" className="text-sm text-ok">{shown.message}</p>}

        <Button type="submit" disabled={pending || mismatch} className="mt-1">
          {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {pendingEmail && (
        <form action={resendAction}>
          <input type="hidden" name="email" value={pendingEmail} />
          <button type="submit" disabled={resendPending} className="text-sm text-cobalt underline-offset-4 hover:underline disabled:opacity-50">
            {resendPending ? "Sending…" : "Didn’t get it? Send the confirmation email again"}
          </button>
        </form>
      )}

      <button
        type="button"
        className="justify-self-start text-sm text-cobalt underline-offset-4 hover:underline"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setConfirmEmail("");
        }}
      >
        {mode === "in" ? "First time here? Create the owner account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
