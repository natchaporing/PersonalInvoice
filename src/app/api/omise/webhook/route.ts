import { getOmiseCharge, omiseEnabled, settleOmiseCharge } from "@/lib/billing/omise";

/**
 * Opn Payments webhook. The body only tells us which charge changed: we fetch that charge from the Opn API with
 * our secret key and settle from what Opn says, so a forged request can't mark anything paid.
 * Register https://<your domain>/api/omise/webhook in the Opn dashboard (Webhooks).
 */
export async function POST(request: Request) {
  if (!omiseEnabled()) return new Response("payments are switched off", { status: 503 });
  let event: { key?: string; data?: { object?: string; id?: string } };
  try {
    event = await request.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const id = event.data?.id;
  if (event.data?.object !== "charge" || typeof id !== "string" || !id.startsWith("chrg_")) return new Response("ignored");
  try {
    const charge = await getOmiseCharge(id);
    // Charges made outside Tra's checkout (for example in the Opn dashboard) carry no Tra charge id.
    if (!charge.metadata?.charge_id) return new Response("ignored");
    return new Response(await settleOmiseCharge(charge));
  } catch (e) {
    console.error("Opn webhook failed", id, e);
    return new Response("error", { status: 500 }); // Opn retries
  }
}
