"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import { type AuthState, resendConfirmation } from "./actions";

/** "Didn't get it?" link that re-sends the confirmation email, with its own result line. */
export function ResendConfirmation({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(resendConfirmation, {});
  const m = useMessages();
  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="email" value={email} />
      <button type="submit" disabled={pending} className="justify-self-start text-sm text-cobalt underline-offset-4 hover:underline disabled:opacity-50">
        {pending ? m.auth.sending : m.auth.resend}
      </button>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-ok">{state.message}</p>}
    </form>
  );
}
