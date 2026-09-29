import "server-only";
import type { requireUser } from "@/lib/supabase/server";
import { todayBangkok } from "@/lib/domain/documents";
import type { ReportDoc } from "@/lib/domain/reports";

type Supa = Awaited<ReturnType<typeof requireUser>>["supabase"];

export const monthParam = (v: unknown) => (typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : todayBangkok().slice(0, 7));

/** Tax documents issued in the given month (drafts and void excluded later by vatSign). */
export async function taxDocsForMonth(supabase: Supa, month: string): Promise<ReportDoc[]> {
  const [y, m] = month.split("-").map(Number);
  const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const { data } = await supabase
    .from("documents")
    .select("id, doc_type, status, number, issue_date, due_date, taxable, vat, total, net_receivable, customer_snapshot")
    .in("doc_type", ["tax_invoice", "receipt_tax_invoice", "credit_note", "debit_note"])
    .gte("issue_date", `${month}-01`)
    .lt("issue_date", end)
    .limit(5000);
  return data ?? [];
}
