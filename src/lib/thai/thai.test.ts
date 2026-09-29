import { describe, expect, it } from "vitest";
import { bahtText } from "./baht-text";
import { computeTotals, roundDiv } from "./money";
import { formatBankAccount } from "./bank";
import { formatDateEN, formatDateTH } from "./thai-date";

describe("money", () => {
  it("rounds half away from zero", () => {
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(-5, 2)).toBe(-3);
    expect(roundDiv(4, 3)).toBe(1);
  });

  it("VAT exclusive with WHT 3% on pre-VAT amount", () => {
    const t = computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 1_000_000 }], vatRegistered: true, whtBps: 300 });
    expect(t).toMatchObject({ taxable: 1_000_000, vat: 70_000, total: 1_070_000, wht: 30_000, netReceivable: 1_040_000 });
  });

  it("VAT inclusive backs VAT out", () => {
    const t = computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 107_000 }], vatRegistered: true, pricesIncludeVat: true });
    expect(t).toMatchObject({ taxable: 100_000, vat: 7_000, total: 107_000 });
  });

  it("non-VAT-registered has no VAT; discount applies before VAT", () => {
    expect(computeTotals({ lines: [{ qtyMilli: 2500, unitPrice: 10_000 }], vatRegistered: false }).total).toBe(25_000);
    const t = computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 100_000 }], discount: 10_000, vatRegistered: true });
    expect(t).toMatchObject({ taxable: 90_000, vat: 6_300, total: 96_300 });
  });

  it("rejects discount above subtotal", () => {
    expect(() => computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 100 }], discount: 200, vatRegistered: false })).toThrow();
  });
});

describe("bahtText", () => {
  it.each([
    [0, "ศูนย์บาทถ้วน"],
    [100, "หนึ่งบาทถ้วน"],
    [1100, "สิบเอ็ดบาทถ้วน"],
    [2100, "ยี่สิบเอ็ดบาทถ้วน"],
    [12345600, "หนึ่งแสนสองหมื่นสามพันสี่ร้อยห้าสิบหกบาทถ้วน"],
    [150, "หนึ่งบาทห้าสิบสตางค์"],
    [50, "ห้าสิบสตางค์"],
    [100000000, "หนึ่งล้านบาทถ้วน"],
    [100000100, "หนึ่งล้านหนึ่งบาทถ้วน"],
  ])("%i satang", (satang, expected) => {
    expect(bahtText(satang)).toBe(expected);
  });
});

describe("thai-date", () => {
  it("formats Buddhist Era and English", () => {
    expect(formatDateTH("2026-09-29")).toBe("29 กันยายน พ.ศ. 2569");
    expect(formatDateEN("2026-09-29")).toBe("29 September 2026");
  });
});

describe("bank account", () => {
  it("formats 10-digit Thai account numbers", () => {
    expect(formatBankAccount("1234567890")).toBe("123-4-56789-0");
    expect(formatBankAccount("123-4-56789-0")).toBe("123-4-56789-0");
  });
  it("groups other lengths in fours", () => {
    expect(formatBankAccount("123456789012")).toBe("1234-5678-9012");
  });
});
