import { describe, expect, it } from "vitest";
import { findBankByName, normalize, searchBanks, THAI_BANKS } from "./banks";

const names = (q: string) => searchBanks(q).map((b) => b.short);

describe("bank list", () => {
  it("has unique codes and short names", () => {
    expect(new Set(THAI_BANKS.map((b) => b.code)).size).toBe(THAI_BANKS.length);
    expect(new Set(THAI_BANKS.map((b) => b.short)).size).toBe(THAI_BANKS.length);
  });

  it("returns every bank for an empty query", () => {
    expect(searchBanks("")).toHaveLength(THAI_BANKS.length);
    expect(searchBanks("   ")).toHaveLength(THAI_BANKS.length);
  });

  it("finds by Thai name, with or without the word ธนาคาร", () => {
    expect(names("กสิกร")).toEqual(["KBANK"]);
    expect(names("ธนาคารกสิกรไทย")).toEqual(["KBANK"]);
    expect(names("ไทยพาณิชย์")).toEqual(["SCB"]);
  });

  it("finds by English name, short code and BOT code, case-insensitively", () => {
    expect(names("Kasikorn")).toEqual(["KBANK"]);
    expect(names("scb")[0]).toBe("SCB");
    expect(names("SCB")[0]).toBe("SCB");
    expect(names("014")[0]).toBe("SCB");
    expect(names("krungsri")).toEqual(["BAY"]);
    expect(names("bangkok bank")[0]).toBe("BBL");
  });

  it("ranks exact and prefix matches above substring matches", () => {
    expect(names("ttb")[0]).toBe("TTB");
    expect(names("krung")).toEqual(expect.arrayContaining(["KTB", "BAY"]));
  });

  it("ignores punctuation and spacing", () => {
    expect(names("k-bank")[0]).toBe("KBANK");
    expect(names("land and houses")).toEqual(["LHFG"]);
  });

  it("returns nothing for unknown text", () => {
    expect(searchBanks("zzzz")).toEqual([]);
  });

  it("finds a saved bank by its stored names", () => {
    expect(findBankByName("ธนาคารกรุงเทพ")?.short).toBe("BBL");
    expect(findBankByName(null, "Kasikornbank")?.short).toBe("KBANK");
    expect(findBankByName("ธนาคารที่ไม่มี")).toBeUndefined();
  });

  it("normalizes consistently", () => {
    expect(normalize("Bangkok Bank")).toBe("bangkokbank");
    expect(normalize("K-Bank")).toBe("kbank");
  });
});
