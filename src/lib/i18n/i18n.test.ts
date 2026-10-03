import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage } from "./config";
import { messages } from "./messages";

describe("localeFromAcceptLanguage", () => {
  it("prefers Thai whenever the browser lists it", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,th;q=0.8")).toBe("th");
    expect(localeFromAcceptLanguage("th-TH")).toBe("th");
  });
  it("falls back to English, then to Thai", () => {
    expect(localeFromAcceptLanguage("en-GB,en;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage("ja-JP")).toBe("th");
    expect(localeFromAcceptLanguage(null)).toBe("th");
  });
});

describe("dictionaries", () => {
  // TypeScript already forces the same keys; this catches empty strings and list-length drift.
  const shape = (o: unknown): string[] =>
    o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => [k, ...shape(v).map((s) => `${k}.${s}`)]) : [];
  it("Thai and English have the same keys and list lengths", () => expect(shape(messages.th)).toEqual(shape(messages.en)));
  it("no empty strings", () => {
    const empty = (o: unknown): boolean => (typeof o === "string" ? o.trim() === "" : o && typeof o === "object" ? Object.values(o).some(empty) : false);
    expect(empty(messages.th) || empty(messages.en)).toBe(false);
  });
});
