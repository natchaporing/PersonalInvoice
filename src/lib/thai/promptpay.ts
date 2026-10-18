// PromptPay QR payloads (Thai QR Payment, EMVCo merchant-presented format), scannable by every Thai banking app.
import type { Satang } from "@/lib/thai/money";

const tlv = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, "0")}${value}`;

/** CRC-16/CCITT-FALSE, as the Thai QR standard requires for tag 63. */
export function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Digits only; a valid PromptPay ID is a 10-digit phone, a 13-digit national/tax ID or a 15-digit e-wallet ID. */
export const normalizePromptPay = (id: string) => id.replace(/\D/g, "");
export const isPromptPayId = (id: string) => /^(\d{10}|\d{13}|\d{15})$/.test(normalizePromptPay(id));

/** Shown to people: 081-234-5678 / 1-2345-67890-12-3 / the e-wallet ID as is. */
export function formatPromptPay(id: string) {
  const d = normalizePromptPay(id);
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 13) return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`;
  return d;
}

/** The QR payload for paying `id`, for an exact amount when one is given (the payer's app then fills it in). */
export function promptPayPayload(id: string, amount?: Satang) {
  const d = normalizePromptPay(id);
  if (!isPromptPayId(d)) throw new Error("Invalid PromptPay ID");
  const target =
    d.length === 10 ? tlv("01", `0066${d.slice(1)}`.padStart(13, "0")) : d.length === 13 ? tlv("02", d) : tlv("03", d);
  const body =
    tlv("00", "01") +
    tlv("01", amount ? "12" : "11") +
    tlv("29", tlv("00", "A000000677010111") + target) +
    tlv("58", "TH") +
    tlv("53", "764") +
    (amount ? tlv("54", (amount / 100).toFixed(2)) : "") +
    "6304";
  return body + crc16(body);
}
