import { describe, expect, it } from "vitest";
import { ETAX_EMAIL_CC, etaxEmailSubject, etaxMailto } from "./email";

describe("e-Tax Invoice by Email", () => {
  it("builds the subject the time-stamp service expects", () => {
    expect(etaxEmailSubject({ docType: "receipt_tax_invoice", issueDate: "2026-10-04", number: "RTX2026-0007" })).toBe("[20261004][INV][RTX2026-0007]");
    expect(etaxEmailSubject({ docType: "credit_note", issueDate: "2026-11-01", number: "CN2026-0001", refNumber: "TX2026-0003" })).toBe("[20261101][CRN][CN2026-0001][TX2026-0003]");
    expect(etaxEmailSubject({ docType: "debit_note", issueDate: "2026-11-01", number: "DN2026-0001", refNumber: "TX2026-0003" })).toBe("[20261101][DBN][DN2026-0001][TX2026-0003]");
    expect(() => etaxEmailSubject({ docType: "invoice", issueDate: "2026-11-01", number: "INV2026-0001" })).toThrow();
  });
  it("puts the buyer in To and the service in CC", () => {
    const url = new URL(etaxMailto("client@example.com", "[20261004][INV][RTX2026-0007]", "Please find attached."));
    expect(url.protocol).toBe("mailto:");
    expect(decodeURIComponent(url.pathname)).toBe("client@example.com");
    expect(url.searchParams.get("cc")).toBe(ETAX_EMAIL_CC);
    expect(url.searchParams.get("subject")).toBe("[20261004][INV][RTX2026-0007]");
  });
});
