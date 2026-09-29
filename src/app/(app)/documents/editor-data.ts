import "server-only";
import { getProfile } from "@/lib/data/documents";
import { type DocType, DOC_TYPES, isAdjustment, sellerSnapshot, todayBangkok } from "@/lib/domain/documents";
import type { Lang } from "@/lib/document-view";
import type { Tables } from "@/lib/supabase/database.types";
import type { requireUser } from "@/lib/supabase/server";
import type { EditorLine, EditorValue } from "./editor";

type Supa = Awaited<ReturnType<typeof requireUser>>["supabase"];

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const toLines = (rows: Tables<"document_lines">[]): EditorLine[] =>
  [...rows]
    .sort((a, b) => a.position - b.position)
    .map((l) => ({
      key: l.id,
      descriptionTh: l.description_th,
      descriptionEn: l.description_en ?? "",
      qty: String(l.qty_milli / 1000),
      unit: l.unit,
      price: (l.unit_price / 100).toFixed(2),
    }));

export function valueFromDocument(doc: Tables<"documents">, lines: Tables<"document_lines">[]): EditorValue {
  return {
    type: doc.doc_type,
    customerId: doc.customer_id ?? "",
    issueDate: doc.issue_date,
    dueDate: doc.due_date ?? "",
    lang: doc.lang as Lang,
    pricesIncludeVat: doc.prices_include_vat,
    whtBps: doc.wht_bps,
    discount: doc.discount ? (doc.discount / 100).toFixed(2) : "0",
    notes: doc.notes ?? "",
    refDocumentId: doc.ref_document_id ?? "",
    reason: doc.reason ?? "",
    lines: toLines(lines),
  };
}

/** Everything the editor needs besides the value itself. */
export async function editorContext(supabase: Supa, ownerId: string) {
  const [customers, items, profile, refs] = await Promise.all([
    supabase.from("customers").select("*").order("name_th"),
    supabase.from("items").select("*").order("name_th"),
    getProfile(supabase, ownerId),
    supabase
      .from("documents")
      .select("id, number, doc_type, customer_id, issue_date")
      .in("status", ["issued", "paid"])
      .order("issue_date", { ascending: false })
      .limit(300),
  ]);
  return {
    customers: customers.data ?? [],
    items: items.data ?? [],
    seller: profile ? sellerSnapshot(profile) : null,
    vatBps: profile?.default_vat_bps ?? 700,
    refs: refs.data ?? [],
  };
}

/** Initial value for a new document, optionally from ?type=, ?ref= (adjust an original) or ?copy= (duplicate). */
export async function initialValue(supabase: Supa, sp: Record<string, string | string[] | undefined>): Promise<EditorValue> {
  const today = todayBangkok();
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const requested = str("type");
  const type: DocType = DOC_TYPES.includes(requested as DocType) ? (requested as DocType) : "tax_invoice";
  const blank: EditorValue = {
    type,
    customerId: str("customer") ?? "",
    issueDate: today,
    dueDate: isAdjustment(type) || type === "receipt_tax_invoice" ? "" : addDays(today, 30),
    lang: "bilingual",
    pricesIncludeVat: false,
    whtBps: 0,
    discount: "0",
    notes: "",
    refDocumentId: "",
    reason: "",
    lines: [{ key: "l1", descriptionTh: "", descriptionEn: "", qty: "1", unit: "", price: "" }],
  };

  const sourceId = str("ref") ?? str("copy");
  if (!sourceId) return blank;
  const [{ data: src }, { data: srcLines }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", sourceId).maybeSingle(),
    supabase.from("document_lines").select("*").eq("document_id", sourceId),
  ]);
  if (!src) return blank;
  const fromSrc = valueFromDocument(src, srcLines ?? []);
  if (str("ref")) {
    return { ...fromSrc, type, issueDate: today, dueDate: "", refDocumentId: src.id, reason: "", notes: "", discount: "0" };
  }
  return { ...fromSrc, issueDate: today, dueDate: fromSrc.dueDate ? addDays(today, 30) : "", refDocumentId: "", reason: "" };
}
