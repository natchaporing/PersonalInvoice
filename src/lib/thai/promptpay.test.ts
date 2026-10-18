import { describe, expect, it } from "vitest";
import { crc16, formatPromptPay, isPromptPayId, promptPayPayload } from "./promptpay";

describe("promptpay", () => {
  it("uses CRC-16/CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("matches the reference payload for a phone number", () => {
    // Same output as the widely used promptpay-qr library.
    expect(promptPayPayload("080-123-4567")).toBe("00020101021129370016A000000677010111011300668012345675802TH530376463046197");
  });

  it("asks for an exact amount when one is given", () => {
    const p = promptPayPayload("0812345678", 123_456);
    expect(p.startsWith("000201010212")).toBe(true);
    expect(p).toContain("54071234.56");
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
  });

  it("handles national ID and e-wallet targets", () => {
    expect(promptPayPayload("1234567890123")).toContain("02131234567890123");
    expect(promptPayPayload("123456789012345")).toContain("0315123456789012345");
  });

  it("validates and formats IDs", () => {
    expect(isPromptPayId("081 234 5678")).toBe(true);
    expect(isPromptPayId("12345")).toBe(false);
    expect(formatPromptPay("0812345678")).toBe("081-234-5678");
    expect(formatPromptPay("1234567890123")).toBe("1-2345-67890-12-3");
    expect(() => promptPayPayload("123")).toThrow();
  });
});
