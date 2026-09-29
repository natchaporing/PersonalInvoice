import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentView } from "@/lib/document-view";
import { customerSnapshot, sellerSnapshot, toDocumentView } from "@/lib/domain/documents";
import type { Database, Tables } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

export interface DocumentBundle {
  doc: Tables<"documents">;
  lines: Tables<"document_lines">[];
  payments: Tables<"payments">[];
  certificates: Tables<"wht_certificates">[];
  customer: Tables<"customers"> | null;
  ref: Pick<Tables<"documents">, "id" | "number" | "doc_type"> | null;
  view: DocumentView;
}

export async function getProfile(supabase: DB, ownerId: string) {
  const { data } = await supabase.from("business_profiles").select("*").eq("owner_id", ownerId).maybeSingle();
  return data;
}

/** A document with everything needed to show, print or act on it. */
export async function getDocumentBundle(supabase: DB, id: string, ownerId: string): Promise<DocumentBundle | null> {
  const { data: doc } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) return null;
  const [lines, payments, certificates, customer, ref, profile] = await Promise.all([
    supabase.from("document_lines").select("*").eq("document_id", id).order("position"),
    supabase.from("payments").select("*").eq("document_id", id).order("paid_on"),
    supabase.from("wht_certificates").select("*").eq("document_id", id).order("issued_on"),
    doc.customer_id ? supabase.from("customers").select("*").eq("id", doc.customer_id).maybeSingle() : Promise.resolve({ data: null }),
    doc.ref_document_id
      ? supabase.from("documents").select("id, number, doc_type").eq("id", doc.ref_document_id).maybeSingle()
      : Promise.resolve({ data: null }),
    doc.status === "draft" ? getProfile(supabase, ownerId) : Promise.resolve(null),
  ]);
  const view = toDocumentView(doc, lines.data ?? [], {
    seller: profile ? sellerSnapshot(profile) : null,
    customer: customer.data ? customerSnapshot(customer.data) : null,
  });
  view.refNumber = ref.data?.number ?? undefined;
  return {
    doc,
    lines: lines.data ?? [],
    payments: payments.data ?? [],
    certificates: certificates.data ?? [],
    customer: customer.data,
    ref: ref.data,
    view,
  };
}

export const paidAmount = (payments: Pick<Tables<"payments">, "amount">[]) => payments.reduce((s, p) => s + p.amount, 0);
