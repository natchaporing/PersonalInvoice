"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
  email?: string;
  /** An address whose confirmation link can be re-sent. */
  pendingEmail?: string;
}

const Email = z.string().trim().toLowerCase().email("Enter a valid email");
const Password = z.string().min(8, "Password must be at least 8 characters");

const SignIn = z.object({ email: Email, password: Password });

const SignUp = z
  .object({ email: Email, confirmEmail: z.string().trim().toLowerCase(), password: Password })
  .refine((v) => v.email === v.confirmEmail, { path: ["confirmEmail"], message: "The two email addresses don't match" });

/** Only allow same-site relative redirects. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
};

/** Public origin for links in emails: APP_URL, else the origin this request came in on. */
async function siteUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = { email: form.get("email"), password: form.get("password") };
  const parsed = SignIn.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(raw.email ?? "") };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Please confirm your email first. Open the link we sent you, or request a new one.", email: parsed.data.email, pendingEmail: parsed.data.email };
    }
    return { error: error.message === "Invalid login credentials" ? "Email or password is incorrect" : error.message, email: parsed.data.email };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = { email: form.get("email"), confirmEmail: form.get("confirmEmail"), password: form.get("password") };
  const parsed = SignUp.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(raw.email ?? "") };
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${await siteUrl()}/auth/callback` } });
  if (error) return { error: error.message, email };
  if (data.session) redirect("/settings"); // project has email confirmation switched off
  return { message: `We sent a confirmation link to ${email}. Open it to activate your account, then sign in.`, email, pendingEmail: email };
}

export async function resendConfirmation(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Email.safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter your email address first." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: `${await siteUrl()}/auth/callback` } });
  if (error) return { error: error.message, email: parsed.data, pendingEmail: parsed.data };
  return { message: `Confirmation link sent again to ${parsed.data}. It can take a minute to arrive; check your spam folder too.`, email: parsed.data, pendingEmail: parsed.data };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
