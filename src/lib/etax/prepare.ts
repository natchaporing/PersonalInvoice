import type { CustomerSnapshot, SellerSnapshot } from "@/lib/domain/documents";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { type EtaxInput, isEtaxDocType } from "./xml";

export interface EtaxSource {
  doc: Tables<"documents">;
  lines: Tables<"document_lines">[];
  /** The live customer record: it has the postcode and email that the issue-time snapshot lacks. */
  customer: Tables<"customers"> | null;
  profile: Tables<"business_profiles"> | null;
  ref: Pick<Tables<"documents">, "number" | "doc_type" | "issue_date" | "taxable"> | null;
}

const asObj = <T,>(j: Json | null): T | null => (j && typeof j === "object" && !Array.isArray(j) ? (j as unknown as T) : null);

/** Bangkok local time, "YYYY-MM-DDTHH:mm:ss", of a timestamp. */
const bangkok = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 19);

/**
 * Everything the e-Tax XML needs, or a plain-language list of what is missing.
 * Uses the frozen snapshots for seller and buyer names and tax IDs, and the live records for the address codes
 * and postcode, which were not part of the snapshot.
 */
export function prepareEtaxInput(src: EtaxSource): { input: EtaxInput } | { problems: string[] } {
  const { doc, lines, customer, profile, ref } = src;
  const problems: string[] = [];

  if (!isEtaxDocType(doc.doc_type)) return { problems: ["Only tax invoices, receipts/tax invoices, credit notes and debit notes can be sent as e-Tax invoices."] };
  if (doc.status === "draft" || doc.status === "void" || !doc.number) problems.push("The document must be issued and not void.");

  const seller = asObj<SellerSnapshot>(doc.seller_snapshot);
  const buyer = asObj<CustomerSnapshot>(doc.customer_snapshot);
  if (!seller || !buyer) problems.push("The document has no seller or buyer details.");

  const sellerTax = seller?.tax_id?.replace(/\D/g, "") ?? "";
  if (seller && !/^\d{13}$/.test(sellerTax)) problems.push("Your tax ID must be 13 digits (Settings).");
  if (
    !profile?.addr_building_number || !profile.addr_province_code || !profile.addr_district_code || !profile.addr_subdistrict_code || !profile.addr_postcode
  ) {
    problems.push("Complete “Address for e-Tax” in Settings (house number, province, district, sub-district, postcode).");
  }

  const buyerTax = buyer?.tax_id?.replace(/\D/g, "") ?? "";
  if (buyer && !/^\d{13}$/.test(buyerTax)) problems.push("The customer needs a 13-digit tax ID.");
  if (buyer && !buyer.address_th) problems.push("The customer needs an address.");
  if (customer && !customer.postcode) problems.push("The customer needs a postcode (edit the customer).");
  if (!customer) problems.push("The customer record no longer exists.");

  const isNote = doc.doc_type === "credit_note" || doc.doc_type === "debit_note";
  if (isNote && (!ref || !ref.number || !doc.reason)) problems.push("A credit or debit note needs its original document and a reason.");
  if (isNote && ref && !isEtaxDocType(ref.doc_type)) problems.push("The original document is not a tax document.");

  if (problems.length || !seller || !buyer || !customer || !profile) return { problems };

  return {
    input: {
      docType: doc.doc_type as EtaxInput["docType"],
      number: doc.number!,
      issueDate: doc.issue_date,
      createdAt: bangkok(doc.created_at),
      dueDate: doc.due_date ?? undefined,
      seller: {
        nameTh: seller.name_th,
        taxId: sellerTax,
        branchCode: seller.branch_code,
        email: seller.email ?? undefined,
        address: {
          postcode: profile.addr_postcode!,
          buildingNumber: profile.addr_building_number!,
          street: profile.addr_street ?? undefined,
          provinceCode: profile.addr_province_code!,
          districtCode: profile.addr_district_code!,
          subdistrictCode: profile.addr_subdistrict_code!,
        },
      },
      buyer: {
        nameTh: buyer.name_th,
        taxId: buyerTax,
        branchCode: buyer.branch_code,
        isJuristic: buyer.is_juristic,
        email: customer.email ?? undefined,
        addressText: buyer.address_th!,
        postcode: customer.postcode!,
      },
      lines: [...lines]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ code: l.product_code ?? undefined, nameTh: l.description_th, qtyMilli: l.qty_milli, unitPrice: l.unit_price, discount: l.discount, vatBps: l.vat_bps })),
      discount: doc.discount,
      vatBps: doc.vat_bps,
      pricesIncludeVat: doc.prices_include_vat,
      notes: doc.notes ?? undefined,
      adjustment: isNote
        ? {
            reason: doc.reason!,
            original: { number: ref!.number!, issueDate: ref!.issue_date, docType: ref!.doc_type as "tax_invoice", taxable: ref!.taxable },
          }
        : undefined,
    },
  };
}
