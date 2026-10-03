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

describe("translateServerText", async () => {
  const { localizeState, translateServerText } = await import("./server-text");
  it("leaves English untouched and translates known messages to Thai", () => {
    expect(translateServerText("Issued and signed.", "en")).toBe("Issued and signed.");
    expect(translateServerText("Issued and signed.", "th")).toBe("ออกเอกสารและลงลายมือชื่อแล้ว");
  });
  it("handles messages with values in them", () => {
    expect(translateServerText("Percentages add up to 90%, not 100%.", "th")).toBe("เปอร์เซ็นต์รวมได้ 90% ไม่ใช่ 100%");
    expect(translateServerText("Amount is required", "th")).toBe("กรุณากรอกจำนวนเงิน");
    expect(translateServerText('Issued. The signed PDF could not be generated yet (timeout); use "Generate signed PDF" to retry.', "th")).toContain("(timeout)");
  });
  it("passes unknown text through and translates every field error", () => {
    expect(translateServerText("duplicate key value", "th")).toBe("duplicate key value");
    expect(localizeState({ error: "Please fix the highlighted fields.", fieldErrors: { customerId: "Choose a customer" } }, "th")).toEqual({
      error: "กรุณาแก้ไขช่องที่ไฮไลต์",
      message: undefined,
      fieldErrors: { customerId: "เลือกลูกค้า" },
    });
  });
});
