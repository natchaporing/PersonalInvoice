import { describe, expect, it } from "vitest";
import { allocate, computeTotals } from "./money";

describe("per-line discount and VAT", () => {
  it("matches a VAT-inclusive quotation with withholding (12,900 → 12,056.07 + 843.93, WHT 3%)", () => {
    const t = computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 1_290_000 }], vatRegistered: true, pricesIncludeVat: true, whtBps: 300 });
    expect(t.taxable).toBe(1_205_607);
    expect(t.vat).toBe(84_393);
    expect(t.total).toBe(1_290_000);
    expect(t.wht).toBe(36_168);
    expect(t.netReceivable).toBe(1_253_832);
  });

  it("takes a line discount off before VAT", () => {
    const t = computeTotals({ lines: [{ qtyMilli: 2000, unitPrice: 50_000, discount: 10_000 }], vatRegistered: true });
    expect(t.subtotal).toBe(90_000);
    expect(t.lineDiscount).toBe(10_000);
    expect(t.vat).toBe(6_300);
    expect(t.total).toBe(96_300);
  });

  it("groups mixed VAT rates and shares the document discount across lines", () => {
    const t = computeTotals({
      lines: [
        { qtyMilli: 1000, unitPrice: 100_000, vatBps: 700 },
        { qtyMilli: 1000, unitPrice: 100_000, vatBps: 0 },
      ],
      discount: 20_000,
      vatRegistered: true,
    });
    expect(t.vatGroups).toEqual([
      { bps: 700, taxable: 90_000, vat: 6_300 },
      { bps: 0, taxable: 90_000, vat: 0 },
    ]);
    expect(t.taxable).toBe(180_000);
    expect(t.vat).toBe(6_300);
    expect(t.total).toBe(186_300);
  });

  it("uses the document rate for lines without their own", () => {
    const t = computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 100_000 }], vatRegistered: true, vatBps: 700 });
    expect(t.vatGroups).toEqual([{ bps: 700, taxable: 100_000, vat: 7_000 }]);
  });

  it("charges no VAT when not VAT registered, whatever the line rate", () => {
    const t = computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 100_000, vatBps: 700 }], vatRegistered: false });
    expect(t.vat).toBe(0);
    expect(t.total).toBe(100_000);
  });

  it("rejects a line discount larger than the line", () => {
    expect(() => computeTotals({ lines: [{ qtyMilli: 1000, unitPrice: 100, discount: 200 }], vatRegistered: true })).toThrow();
  });

  it("allocates exactly, with no satang lost", () => {
    const parts = allocate(100, [1, 1, 1]);
    expect(parts.reduce((s, p) => s + p, 0)).toBe(100);
    expect(allocate(0, [5, 5])).toEqual([0, 0]);
  });
});
