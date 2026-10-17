import { describe, expect, it } from "vitest";
import { contractCanonical, contractNumber, defaultClauses, fillTokens, stampDuty, type ContractFacts } from "./contracts";

const facts: ContractFacts = {
  quotationNumber: "QT2026-0007",
  quotationDate: "2026-10-17",
  lines: [{ descriptionTh: "ออกแบบเว็บไซต์", qty: "1", unit: "งาน", amount: 5_000_000 }],
  taxable: 5_000_000,
  vat: 350_000,
  total: 5_350_000,
  whtBps: 300,
  schedule: [{ label: "มัดจำ · Deposit", pctBps: 5000, amount: 2_500_000 }],
};

describe("contracts", () => {
  it("stamp duty is 1 baht per 1,000 baht or part of it", () => {
    expect(stampDuty(5_000_000)).toBe(5_000); // ฿50,000 → ฿50
    expect(stampDuty(5_000_100)).toBe(5_100); // ฿50,001 → ฿51
    expect(stampDuty(99_900)).toBe(100); // ฿999 → ฿1
    expect(stampDuty(0)).toBe(0);
  });

  it("fills tokens with the contract's figures and dates, in each language", () => {
    const th = fillTokens("{{quotation}} {{price}} {{total}} {{start}} {{end}} {{nope}}", facts, { start: "2026-11-01" }, "th");
    expect(th).toBe("QT2026-0007 50,000.00 53,500.00 1 พฤศจิกายน พ.ศ. 2569 (ยังไม่ระบุ) {{nope}}");
    expect(fillTokens("{{start}}", facts, { start: "2026-11-01" }, "en")).toMatch(/1 November 2026/);
  });

  it("the default agreement has scope and payment sections and mentions withholding only when it applies", () => {
    const c = defaultClauses(facts);
    expect(c.map((x) => x.kind).filter(Boolean)).toEqual(["scope", "payment"]);
    expect(c.find((x) => x.kind === "payment")?.body_th).toMatch(/ณ ที่จ่าย/);
    expect(defaultClauses({ ...facts, whtBps: 0 }).find((x) => x.kind === "payment")?.body_en).not.toMatch(/withhold/);
    for (const x of c) expect(x.title_th && x.title_en && x.body_th && x.body_en).toBeTruthy();
  });

  it("canonical text ignores key order but not content", () => {
    const base = { number: "CT1", lang: "th", contract_date: "2026-10-17", place: null, start_date: null, end_date: null, clauses: [{ a: 1, b: 2 }], facts: {}, seller_snapshot: {}, client_snapshot: {}, owner_signer: null };
    expect(contractCanonical(base)).toBe(contractCanonical({ ...base, clauses: [{ b: 2, a: 1 }] }));
    expect(contractCanonical(base)).not.toBe(contractCanonical({ ...base, clauses: [{ a: 1, b: 3 }] }));
  });

  it("numbers follow the quotation", () => {
    expect(contractNumber("QT2026-0007", 0)).toBe("CT2026-0007");
    expect(contractNumber("QT2026-0007", 1)).toBe("CT2026-0007-2");
  });
});
