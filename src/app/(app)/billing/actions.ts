"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPlanKey } from "@/lib/domain/billing";
import type { FormState } from "@/lib/domain/forms";
import { testPaymentsEnabled } from "@/lib/billing/access";
import { requireUser } from "@/lib/supabase/server";

/**
 * Pays for a plan. Today only test mode exists: the charge is created by the database at its own price, then
 * confirmed with the test secret. A real provider (Omise or 2C2P) slots in here: create the charge with the
 * provider, send the customer to its PromptPay QR or card page, and let its webhook call apply_paid_charge.
 */
export async function checkout(_: FormState, form: FormData): Promise<FormState> {
  const plan = form.get("plan");
  const method = form.get("method");
  if (!isPlanKey(plan)) return { error: "Choose a plan." };
  if (method !== "promptpay" && method !== "card") return { error: "Choose how to pay." };
  if (!testPaymentsEnabled()) return { error: "Online payment isn't switched on yet." };

  const { supabase } = await requireUser();
  const { data: chargeId, error } = await supabase.rpc("start_checkout", { p_plan: plan, p_method: method });
  if (error || !chargeId) return { error: error?.message ?? "Could not start the payment." };
  const paid = await supabase.rpc("complete_test_charge", { p_charge: chargeId, p_secret: process.env.BILLING_TEST_SECRET! });
  if (paid.error) return { error: paid.error.message };
  revalidatePath("/", "layout"); // the trial banner lives in the shared layout
  redirect(`/billing?paid=${chargeId}`);
}
