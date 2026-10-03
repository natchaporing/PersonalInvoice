import "server-only";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseEnv } from "@/lib/supabase/server";

/**
 * Opn Payments (Omise). Card numbers never reach Tra: the browser turns them into a token with Omise.js. The
 * server creates charges with the secret key and trusts only charges it fetches back from the Opn API.
 */

export type OmiseCharge = {
  id: string;
  status: "pending" | "successful" | "failed" | "expired" | "reversed";
  paid: boolean;
  amount: number;
  currency: string;
  metadata?: { charge_id?: string } | null;
  authorize_uri?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
  expires_at?: string | null;
  source?: { type: string; scannable_code?: { image?: { download_uri?: string } } | null } | null;
};

const apiBase = () => (process.env.OMISE_API_BASE ?? "https://api.omise.co").replace(/\/$/, "");

/** Online payment is on when the server holds both Opn keys and the secret the database checks when settling. */
export const omiseEnabled = () => !!(process.env.OMISE_PUBLIC_KEY && process.env.OMISE_SECRET_KEY && process.env.BILLING_PROVIDER_SECRET);
export const omisePublicKey = () => process.env.OMISE_PUBLIC_KEY ?? "";
/** Test keys: no money moves, and the PromptPay page can simulate the customer paying. */
export const omiseTestMode = () => (process.env.OMISE_SECRET_KEY ?? "").startsWith("skey_test_");

async function omise<T>(path: string, form?: Record<string, string>): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: form ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString("base64")}`,
      ...(form && { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: form && new URLSearchParams(form),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || body.object === "error") throw new Error(body.message ?? `Opn Payments error ${res.status}`);
  return body as T;
}

export function createOmiseCharge(o: { chargeId: string; amount: number; description: string; method: "promptpay" | "card"; token?: string; returnUri: string }) {
  return omise<OmiseCharge>("/charges", {
    amount: String(o.amount),
    currency: "thb",
    description: o.description,
    "metadata[charge_id]": o.chargeId,
    return_uri: o.returnUri,
    ...(o.method === "card" ? { card: o.token ?? "" } : { "source[type]": "promptpay" }),
  });
}

export const getOmiseCharge = (id: string) => omise<OmiseCharge>(`/charges/${encodeURIComponent(id)}`);

/** Test keys only: what scanning the QR with a banking app does. */
export const markOmiseChargePaid = (id: string) => omise<OmiseCharge>(`/charges/${encodeURIComponent(id)}/mark_as_paid`, {});

/** The PromptPay QR as a data URL, fetched with the secret key so the page never links to the provider. */
export async function omiseQrDataUrl(charge: OmiseCharge) {
  const uri = charge.source?.scannable_code?.image?.download_uri;
  if (!uri) return null;
  const res = await fetch(uri, {
    headers: { Authorization: `Basic ${Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString("base64")}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const type = res.headers.get("content-type")?.split(";")[0] || "image/svg+xml";
  return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}

export type SettleStatus = "paid" | "failed" | "expired" | "pending";

export const omiseVerdict = (c: OmiseCharge): SettleStatus =>
  c.status === "successful" && c.paid ? "paid" : c.status === "failed" ? "failed" : c.status === "expired" ? "expired" : "pending";

/**
 * Records an Opn charge's outcome on our charge. Pass only a charge fetched from the Opn API. Runs without a
 * user session (the webhook has none); the database accepts it because the server proves it holds the secret.
 */
export async function settleOmiseCharge(c: OmiseCharge): Promise<SettleStatus> {
  const chargeId = c.metadata?.charge_id;
  if (!chargeId) throw new Error(`Opn charge ${c.id} has no Tra charge id`);
  const { url, key } = supabaseEnv();
  const db = createPlainClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc("settle_provider_charge", {
    p_charge: chargeId,
    p_provider: "omise",
    p_ref: c.id,
    p_status: omiseVerdict(c),
    p_amount: c.amount,
    p_secret: process.env.BILLING_PROVIDER_SECRET!,
  });
  if (error) throw new Error(error.message);
  return data as SettleStatus;
}
