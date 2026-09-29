"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState, signIn, signUp } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
    <form action={mode === "in" ? inAction : upAction} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email ?? ""} required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} required />
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-ok">{state.message}</p>}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
      </Button>
      <button type="button" className="text-sm text-cobalt underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "First time here? Create the owner account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
