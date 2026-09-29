const DIGITS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function readBelowMillion(n: number): string {
  const s = String(n);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const d = Number(s[i]);
    const pos = s.length - i - 1;
    if (d === 0) continue;
    if (pos === 0 && d === 1 && s.length > 1) out += "เอ็ด";
    else if (pos === 1 && d === 2) out += "ยี่สิบ";
    else if (pos === 1 && d === 1) out += "สิบ";
    else out += DIGITS[d] + PLACES[pos];
  }
  return out;
}

function readInteger(n: number): string {
  if (n === 0) return DIGITS[0];
  const groups: number[] = [];
  while (n > 0) {
    groups.push(n % 1_000_000);
    n = Math.floor(n / 1_000_000);
  }
  let out = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    out += readBelowMillion(groups[i]) + "ล้าน".repeat(i);
  }
  return out;
}

/** 123456 satang → "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบหกสตางค์" */
export function bahtText(satang: number): string {
  if (!Number.isInteger(satang) || satang < 0) throw new Error("satang must be a non-negative integer");
  const baht = Math.floor(satang / 100);
  const sat = satang % 100;
  const bahtPart = readInteger(baht) + "บาท";
  return sat === 0 ? bahtPart + "ถ้วน" : (baht === 0 ? "" : bahtPart) + readInteger(sat) + "สตางค์";
}
