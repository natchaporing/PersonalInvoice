import { createClient } from "@/lib/supabase/server";

// Everything the account owns. Row-level security limits every query to the signed-in user's own rows.
const TABLES = [
  "business_profiles", "signatories", "customers", "items", "documents", "document_lines", "payments", "wht_certificates",
  "installments", "commission_payees", "commissions", "subscriptions", "billing_charges",
] as const;

/** PDPA right to a copy of your data (s.30/s.31): a JSON file of the account's records. */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return new Response("sign in first", { status: 401 });
  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: { id: data.user.id, email: data.user.email, created_at: data.user.created_at },
  };
  for (const t of TABLES) {
    const { data: rows, error } = await supabase.from(t).select("*").limit(50_000);
    out[t] = error ? { error: error.message } : rows;
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tra-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
