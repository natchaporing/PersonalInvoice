"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { isJuristicTaxId, taxIdChecksumOk } from "@/lib/thai/tax-id";

export interface AuthState {
  error?: string;
  message?: string;
  email?: string;
  /** An address whose confirmation link can be re-sent. */
  pendingEmail?: string;
  /** Field to point the error at (register form). */
  field?: string;
  /** What was typed, so a refused form comes back filled in (never the password). */
  values?: Record<string, string>;
}

/** Validation schemas with messages in the visitor's language. */
function schemas(m: Messages) {
  const Email = z.string().trim().toLowerCase().email(m.auth.errEmail);
  const Password = z.string().min(8, m.auth.errPassword);
  const TaxId = z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^\d{13}$/.test(v), m.auth.errTaxIdDigits)
    .refine((v) => !isJuristicTaxId(v), m.auth.errTaxIdCompany)
    .refine(taxIdChecksumOk, m.auth.errTaxIdChecksum);
  return {
    Email,
    SignIn: z.object({ email: Email, password: Password }),
    SignUp: z
      .object({
        name: z.string().trim().min(2, m.auth.errName).max(200),
        taxId: TaxId,
        email: Email,
        confirmEmail: z.string().trim().toLowerCase(),
        password: Password,
        terms: z.literal("on", { message: m.auth.errTerms }),
      })
      .refine((v) => v.email === v.confirmEmail, { path: ["confirmEmail"], message: m.auth.emailsDiffer }),
  };
}

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
  const m = await getMessages();
  const raw = { email: form.get("email"), password: form.get("password") };
  const parsed = schemas(m).SignIn.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, email: String(raw.email ?? "") };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: m.auth.errConfirmFirst, email: parsed.data.email, pendingEmail: parsed.data.email };
    }
    return { error: error.message === "Invalid login credentials" ? m.auth.errLogin : error.message, email: parsed.data.email };
  }
  redirect(safeNext(form.get("next")));
}

/** Creates the account with a 15-day trial (started by the database). Individuals only: a company tax ID is refused. */
export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const m = await getMessages();
  const values = {
    name: String(form.get("name") ?? ""),
    taxId: String(form.get("taxId") ?? ""),
    email: String(form.get("email") ?? ""),
    confirmEmail: String(form.get("confirmEmail") ?? ""),
  };
  const parsed = schemas(m).SignUp.safeParse({ ...values, password: form.get("password"), terms: form.get("terms") ?? undefined });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0] ?? ""), values };
  }
  const { email, password, name, taxId } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
      data: { full_name: name, tax_id: taxId, terms_accepted_at: new Date().toISOString() },
    },
  });
  if (error) return { error: error.message, values };
  if (data.session) redirect("/settings"); // project has email confirmation switched off
  return { message: m.auth.sentConfirm(email), email, pendingEmail: email };
}

export async function resendConfirmation(_: AuthState, form: FormData): Promise<AuthState> {
  const m = await getMessages();
  const parsed = schemas(m).Email.safeParse(form.get("email"));
  if (!parsed.success) return { error: m.auth.errEmailFirst };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: `${await siteUrl()}/auth/callback` } });
  if (error) return { error: error.message, email: parsed.data, pendingEmail: parsed.data };
  return { message: m.auth.resent(parsed.data), email: parsed.data, pendingEmail: parsed.data };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
