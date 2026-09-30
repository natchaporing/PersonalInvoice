import { describe, expect, it } from "vitest";
import type { Tables } from "@/lib/supabase/database.types";
import { prepareEtaxInput } from "./prepare";

const doc = (over: Partial<Tables<"documents">> = {}): Tables<"documents"> =>
  ({
    id: "d1", doc_type: "tax_invoice", status: "issued", number: "TX2026-0001", issue_date: "2026-09-30", due_date: null,
    created_at: "2026-09-30T07:05:09.000Z", discount: 0, vat_bps: 700, prices_include_vat: false, notes: null, reason: null,
    seller_snapshot: { name_th: "ผู้ขาย", tax_id: "1101700123456", branch_code: "00000", email: "s@example.com" },
    customer_snapshot: { name_th: "ผู้ซื้อ", tax_id: "0105561000001", branch_code: "00000", is_juristic: true, address_th: "99 ถนนสุขุมวิท" },
    ...over,
  }) as Tables<"documents">;

const line = { position: 1, description_th: "งาน", product_code: null, qty_milli: 1000, unit_price: 100_000, discount: 0, vat_bps: 700 } as Tables<"document_lines">;
const customer = { postcode: "10110", email: null } as Tables<"customers">;
const profile = { addr_building_number: "88", addr_street: null, addr_province_code: "10", addr_district_code: "1017", addr_subdistrict_code: "101701", addr_postcode: "10310" } as Tables<"business_profiles">;

describe("prepareEtaxInput", () => {
  it("builds the input when everything is present", () => {
    const r = prepareEtaxInput({ doc: doc(), lines: [line], customer, profile, ref: null });
    expect("input" in r).toBe(true);
    if ("input" in r) {
      expect(r.input.createdAt).toBe("2026-09-30T14:05:09"); // Bangkok time
      expect(r.input.seller.taxId).toBe("1101700123456");
      expect(r.input.buyer.postcode).toBe("10110");
    }
  });

  it("lists what is missing in plain language", () => {
    const r = prepareEtaxInput({ doc: doc(), lines: [line], customer: { ...customer, postcode: null } as Tables<"customers">, profile: { ...profile, addr_postcode: null } as Tables<"business_profiles">, ref: null });
    expect("problems" in r && r.problems.join(" ")).toMatch(/Address for e-Tax/);
    expect("problems" in r && r.problems.join(" ")).toMatch(/customer needs a postcode/);
  });

  it("refuses drafts, void documents and non-tax documents", () => {
    expect("problems" in prepareEtaxInput({ doc: doc({ status: "draft" }), lines: [line], customer, profile, ref: null })).toBe(true);
    expect("problems" in prepareEtaxInput({ doc: doc({ doc_type: "quotation" }), lines: [line], customer, profile, ref: null })).toBe(true);
  });

  it("needs the original document and a reason for a credit note", () => {
    const r = prepareEtaxInput({ doc: doc({ doc_type: "credit_note" }), lines: [line], customer, profile, ref: null });
    expect("problems" in r && r.problems.join(" ")).toMatch(/original document and a reason/);
  });
});
