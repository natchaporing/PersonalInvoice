import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;

export interface UnpaidRow {
  id: string;
  payeeId: string | null;
  payeeName: string;
  promptpay: string | null;
  quotationId: string;
  number: string | null;
  customer: string | null;
  issueDate: string | null;
  net: number;
}

/** Commissions not yet paid, oldest quotation first, optionally for one payee. */
export async function unpaidCommissions(supabase: Supa, payeeId?: string): Promise<UnpaidRow[]> {
  let q = supabase.from("commissions").select("id, payee_id, payee_name, amount, wht, quotation_id, created_at").is("paid_on", null);
  if (payeeId) q = q.eq("payee_id", payeeId);
  const { data: rows } = await q.order("created_at");
  if (!rows?.length) return [];
  const qIds = [...new Set(rows.map((r) => r.quotation_id))];
  const pIds = [...new Set(rows.map((r) => r.payee_id).filter((x): x is string => !!x))];
  const [{ data: docs }, { data: payees }] = await Promise.all([
    supabase.from("documents").select("id, number, issue_date, customer_snapshot").in("id", qIds),
    pIds.length ? supabase.from("commission_payees").select("id, promptpay_id").in("id", pIds) : Promise.resolve({ data: [] as { id: string; promptpay_id: string | null }[] }),
  ]);
  return rows
    .map((r) => {
      const d = docs?.find((x) => x.id === r.quotation_id);
      const customer = (d?.customer_snapshot as { name_th?: string } | null)?.name_th ?? null;
      return {
        id: r.id, payeeId: r.payee_id, payeeName: r.payee_name, quotationId: r.quotation_id,
        promptpay: payees?.find((p) => p.id === r.payee_id)?.promptpay_id ?? null,
        number: d?.number ?? null, customer, issueDate: d?.issue_date ?? null, net: r.amount - r.wht,
      };
    })
    .sort((a, b) => (a.issueDate ?? "").localeCompare(b.issueDate ?? ""));
}
