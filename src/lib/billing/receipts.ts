import "server-only";
import { toDocumentView } from "@/lib/domain/documents";
import type { Tables } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";

type DB = Awaited<ReturnType<typeof createClient>>;

/** The signed-in subscriber's receipt/tax invoice for one of their charges, ready to render. Null if none. */
export async function getSubscriptionReceipt(supabase: DB, chargeId: string) {
  const { data } = await supabase.rpc("subscription_receipt", { p_charge: chargeId });
  const r = data as { doc: Tables<"documents">; lines: Tables<"document_lines">[] } | null;
  if (!r?.doc) return null;
  return { doc: r.doc, view: toDocumentView(r.doc, r.lines) };
}
