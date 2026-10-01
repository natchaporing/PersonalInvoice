import { describe, expect, it } from "vitest";
import { DOC_TYPES, showsBankDetails } from "./documents";

describe("showsBankDetails", () => {
  it("prints bank details on quotations and payable documents only", () => {
    expect(DOC_TYPES.filter(showsBankDetails)).toEqual(["quotation", "invoice", "tax_invoice", "debit_note"]);
  });
});
