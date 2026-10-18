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

/** Quotations among `ids` that were cancelled (void): their unpaid commissions are cancelled with them. */
export async function voidQuotations(supabase: Supa, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data } = await supabase.from("documents").select("id").in("id", [...new Set(ids)]).eq("status", "void");
  return new Set((data ?? []).map((d) => d.id));
}

/** Commissions not yet paid on quotations that still stand, oldest quotation first, optionally for one payee. */
export async function unpaidCommissions(supabase: Supa, payeeId?: string): Promise<UnpaidRow[]> {
  let q = supabase.from("commissions").select("id, payee_id, payee_name, amount, wht, quotation_id, created_at").is("paid_on", null);
  if (payeeId) q = q.eq("payee_id", payeeId);
  const { data: rows } = await q.order("created_at");
  if (!rows?.length) return [];
  const qIds = [...new Set(rows.map((r) => r.quotation_id))];
  const pIds = [...new Set(rows.map((r) => r.payee_id).filter((x): x is string => !!x))];
  const [{ data: docs }, { data: payees }] = await Promise.all([
    supabase.from("documents").select("id, number, issue_date, customer_snapshot, status").in("id", qIds),
    pIds.length ? supabase.from("commission_payees").select("id, promptpay_id").in("id", pIds) : Promise.resolve({ data: [] as { id: string; promptpay_id: string | null }[] }),
  ]);
  const cancelled = new Set((docs ?? []).filter((d) => d.status === "void").map((d) => d.id));
  return rows
    .filter((r) => !cancelled.has(r.quotation_id))
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
