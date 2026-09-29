function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Phone (10 digits, leading 0) → sub-tag 01; 13-digit tax/national ID → 02; 15-digit e-wallet → 03. */
function target(idRaw: string): { tag: string; value: string } {
  const id = idRaw.replace(/\D/g, "");
  if (id.length === 10 && id.startsWith("0")) return { tag: "01", value: "0066" + id.slice(1) };
  if (id.length === 13) return { tag: "02", value: id };
  if (id.length === 15) return { tag: "03", value: id };
  throw new Error("PromptPay ID must be a 10-digit phone, 13-digit tax ID, or 15-digit e-wallet ID");
}

/** Build a Thai QR / PromptPay payload. Pass amountSatang for a dynamic (one-time) QR. */
export function promptPayPayload(promptPayId: string, amountSatang?: number): string {
  const t = target(promptPayId);
  const dynamic = amountSatang !== undefined && amountSatang > 0;
  const merchant = tlv("00", "A000000677010111") + tlv(t.tag, t.value);
  let body =
    tlv("00", "01") +
    tlv("01", dynamic ? "12" : "11") +
    tlv("29", merchant) +
    tlv("53", "764") +
    (dynamic ? tlv("54", (amountSatang! / 100).toFixed(2)) : "") +
    tlv("58", "TH");
  body += "6304";
  return body + crc16(body);
}
