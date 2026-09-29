import { describe, expect, it } from "vitest";
import { bahtText } from "./baht-text";
import { computeTotals, roundDiv } from "./money";
import { crc16, promptPayPayload } from "./promptpay";
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

describe("promptpay", () => {
  it("CRC16-CCITT-FALSE check value", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("builds a dynamic phone payload with valid CRC", () => {
    const p = promptPayPayload("081-234-5678", 12345);
    expect(p.startsWith("000201010212")).toBe(true);
    expect(p).toContain("A000000677010111011300668123456785303764540" + "6123.45");
    expect(p).toContain("5802TH6304");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });

  it("uses tag 02 for 13-digit tax ID and static QR without amount", () => {
    const p = promptPayPayload("0105555555555");
    expect(p.startsWith("000201010211")).toBe(true);
    expect(p).toContain("02130105555555555");
    expect(p).toContain("53037645802TH6304");
  });

  it("rejects malformed IDs", () => {
    expect(() => promptPayPayload("12345")).toThrow();
  });
});
