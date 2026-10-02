"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthHash } from "@/components/auth-hash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, signIn } from "./actions";
import { ResendConfirmation } from "./resend";

export function LoginForm({ next, linkFailed }: { next: string; linkFailed?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});

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

      <form action={action} className="grid gap-4">
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
        </div>
        {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending} className="mt-1">{pending ? "Please wait…" : "Sign in"}</Button>
      </form>

      {state.pendingEmail && <ResendConfirmation email={state.pendingEmail} />}

      <p className="text-sm text-muted-foreground">
        New to Tra?{" "}
        <Link href="/register" className="font-medium text-cobalt underline-offset-4 hover:underline">Start a 15-day free trial</Link>
      </p>
    </div>
  );
}
