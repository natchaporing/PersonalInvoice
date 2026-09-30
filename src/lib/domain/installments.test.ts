import { describe, expect, it } from "vitest";
import { commissionFigures, installmentLines, installmentStage, planProblems, PLAN_PRESETS, splitAmount } from "./installments";

describe("installment plans", () => {
  it("presets add up to 100%", () => {
    for (const p of PLAN_PRESETS) expect(planProblems(p.rows)).toEqual([]);
  });

  it("rejects plans that do not add up or have one row", () => {
    expect(planProblems([{ label: "a", pctBps: 5000 }, { label: "b", pctBps: 4000 }]).join()).toMatch(/90%/);
    expect(planProblems([{ label: "a", pctBps: 10000 }]).join()).toMatch(/at least two/);
    expect(planProblems([{ label: "", pctBps: 5000 }, { label: "b", pctBps: 5000 }]).join()).toMatch(/label/);
  });

  it("splits exactly, the last installment taking the rounding", () => {
    expect(splitAmount(100_001, [5000, 5000])).toEqual([50_001, 50_000]);
    const three = splitAmount(100_000, [3333, 3333, 3334]);
    expect(three.reduce((s, x) => s + x, 0)).toBe(100_000);
    expect(splitAmount(3_700_000, [3000, 7000])).toEqual([1_110_000, 2_590_000]);
  });

  it("keeps the quotation's VAT mix on each installment", () => {
    const lines = installmentLines(1_850_000, [{ bps: 700, taxable: 3_600_000 }, { bps: 0, taxable: 100_000 }]);
    expect(lines.map((l) => l.vatBps)).toEqual([700, 0]);
    expect(lines.reduce((s, l) => s + l.amount, 0)).toBe(1_850_000);
    expect(installmentLines(500, [{ bps: 700, taxable: 1000 }])).toEqual([{ vatBps: 700, amount: 500 }]);
  });

  it("tracks the stage from linked documents, ignoring void ones", () => {
    const docs = [
      { id: "i0", doc_type: "invoice", status: "void", number: "INV-1", total: 1, installment_id: "a" },
      { id: "i1", doc_type: "invoice", status: "paid", number: "INV-2", total: 1, installment_id: "a" },
    ];
    expect(installmentStage("a", docs).stage).toBe("paid");
    expect(installmentStage("a", docs).invoice?.id).toBe("i1");
    expect(installmentStage("b", docs).stage).toBe("planned");
    const receipted = [...docs, { id: "r1", doc_type: "receipt_tax_invoice", status: "issued", number: "RTX-1", total: 1, installment_id: "a" }];
    expect(installmentStage("a", receipted).stage).toBe("receipted");
  });
});

describe("commission", () => {
  it("percent of the amount before VAT, with withholding", () => {
    expect(commissionFigures({ basis: "percent", rateBps: 1000, whtBps: 300 }, 3_700_000)).toEqual({ amount: 370_000, wht: 11_100, net: 358_900 });
  });
  it("fixed amount", () => {
    expect(commissionFigures({ basis: "fixed", fixed: 500_000, whtBps: 0 }, 1)).toEqual({ amount: 500_000, wht: 0, net: 500_000 });
  });
});
