"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPlanKey, PLANS, planTotal } from "@/lib/domain/billing";
import type { FormState } from "@/lib/domain/forms";
import { testPaymentsEnabled } from "@/lib/billing/access";
import { createOmiseCharge, getOmiseCharge, markOmiseChargePaid, omiseEnabled, omiseTestMode, settleOmiseCharge, type SettleStatus } from "@/lib/billing/omise";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

/** Public origin for the card 3-D Secure return: APP_URL, else the origin this request came in on. */
async function origin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

const paidRedirect = (chargeId: string) => {
  revalidatePath("/", "layout"); // the trial banner lives in the shared layout
  redirect(`/settings/billing?paid=${chargeId}`);
};

/**
 * Pays for a plan. The database creates our charge at its own price. With Opn Payments switched on, the charge
 * goes to Opn (a PromptPay QR, or a card token made in the browser); the QR page or the card's 3-D Secure return
 * then waits for the payment, which the webhook or the page's status check settles. Without Opn, test mode
 * confirms the charge straight away with the test secret.
 */
export async function checkout(_: FormState, form: FormData): Promise<FormState> {
  const m = await getMessages();
  const plan = form.get("plan");
  const method = form.get("method");
  if (!isPlanKey(plan)) return { error: m.billing.errPlan };
  if (method !== "promptpay" && method !== "card") return { error: m.billing.errMethod };
  const token = String(form.get("omiseToken") ?? "");
  const useOmise = omiseEnabled();
  if (!useOmise && !testPaymentsEnabled()) return { error: m.billing.notYet };
  if (useOmise && method === "card" && !token.startsWith("tokn_")) return { error: m.billing.errCard };

  const { supabase } = await requireUser();
  const { data: chargeId, error } = await supabase.rpc("start_checkout", { p_plan: plan, p_method: method });
  if (error || !chargeId) return { error: error?.message ?? m.billing.errStart };

  if (!useOmise) {
    const paid = await supabase.rpc("complete_test_charge", { p_charge: chargeId, p_secret: process.env.BILLING_TEST_SECRET! });
    if (paid.error) return { error: paid.error.message };
    paidRedirect(chargeId);
  }

  const payPage = `/settings/billing/pay/${chargeId}`;
  let next: string;
  try {
    const charge = await createOmiseCharge({
      chargeId,
      amount: planTotal(plan),
      description: `Tra ${PLANS[plan].label}`,
      method,
      token,
      returnUri: `${await origin()}${payPage}`,
    });
    const attached = await supabase.rpc("attach_provider_charge", { p_charge: chargeId, p_provider: "omise", p_ref: charge.id });
    if (attached.error) throw new Error(attached.error.message);
    const status = await settleOmiseCharge(charge);
    if (status === "paid") next = "paid";
    else if (status === "failed") return { error: m.billing.errDeclined(charge.failure_message ?? m.billing.payFailed) };
    // A card that needs 3-D Secure goes to the bank's page, which returns to the pay page.
    else next = method === "card" && charge.authorize_uri ? charge.authorize_uri : payPage;
  } catch (e) {
    console.error("Opn checkout failed", e);
    return { error: e instanceof Error ? `${m.billing.errStart} ${e.message}` : m.billing.errStart };
  }
  if (next === "paid") paidRedirect(chargeId);
  redirect(next);
}

/** Checks a pending charge with Opn and records the outcome. The pay page calls this every few seconds. */
export async function chargeStatus(chargeId: string): Promise<SettleStatus> {
  const { supabase } = await requireUser();
  const { data: c } = await supabase.from("billing_charges").select("status, provider, provider_ref").eq("id", chargeId).maybeSingle();
  if (!c) return "failed";
  if (c.status !== "pending") return c.status as SettleStatus;
  if (c.provider !== "omise" || !c.provider_ref || !omiseEnabled()) return "pending";
  const status = await settleOmiseCharge(await getOmiseCharge(c.provider_ref));
  if (status === "paid") revalidatePath("/", "layout");
  return status;
}

/** Test keys only: does what the customer's banking app would, so the whole flow can be tried without money. */
export async function simulatePayment(chargeId: string): Promise<SettleStatus> {
  if (!omiseTestMode()) return "pending";
  const { supabase } = await requireUser();
  const { data: c } = await supabase.from("billing_charges").select("provider_ref").eq("id", chargeId).maybeSingle();
  if (!c?.provider_ref) return "pending";
  await markOmiseChargePaid(c.provider_ref);
  return chargeStatus(chargeId);
}
