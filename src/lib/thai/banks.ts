// Thai banks for the bank-account picker. `code` is the 3-digit Bank of Thailand bank code.
export interface Bank {
  code: string;
  short: string;
  th: string;
  en: string;
}

export const THAI_BANKS: Bank[] = [
  { code: "002", short: "BBL", th: "ธนาคารกรุงเทพ", en: "Bangkok Bank" },
  { code: "004", short: "KBANK", th: "ธนาคารกสิกรไทย", en: "Kasikornbank" },
  { code: "006", short: "KTB", th: "ธนาคารกรุงไทย", en: "Krung Thai Bank" },
  { code: "011", short: "TTB", th: "ธนาคารทหารไทยธนชาต", en: "TMBThanachart Bank" },
  { code: "014", short: "SCB", th: "ธนาคารไทยพาณิชย์", en: "Siam Commercial Bank" },
  { code: "025", short: "BAY", th: "ธนาคารกรุงศรีอยุธยา", en: "Bank of Ayudhya (Krungsri)" },
  { code: "030", short: "GSB", th: "ธนาคารออมสิน", en: "Government Savings Bank" },
  { code: "033", short: "GHB", th: "ธนาคารอาคารสงเคราะห์", en: "Government Housing Bank" },
  { code: "034", short: "BAAC", th: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", en: "Bank for Agriculture and Agricultural Cooperatives" },
  { code: "022", short: "CIMBT", th: "ธนาคารซีไอเอ็มบี ไทย", en: "CIMB Thai Bank" },
  { code: "024", short: "UOB", th: "ธนาคารยูโอบี", en: "United Overseas Bank (Thai)" },
  { code: "069", short: "KKP", th: "ธนาคารเกียรตินาคินภัทร", en: "Kiatnakin Phatra Bank" },
  { code: "067", short: "TISCO", th: "ธนาคารทิสโก้", en: "TISCO Bank" },
  { code: "073", short: "LHFG", th: "ธนาคารแลนด์ แอนด์ เฮ้าส์", en: "Land and Houses Bank" },
  { code: "071", short: "TCRB", th: "ธนาคารไทยเครดิต", en: "Thai Credit Bank" },
  { code: "070", short: "ICBCT", th: "ธนาคารไอซีบีซี (ไทย)", en: "ICBC (Thai)" },
  { code: "066", short: "IBANK", th: "ธนาคารอิสลามแห่งประเทศไทย", en: "Islamic Bank of Thailand" },
  { code: "020", short: "SCBT", th: "ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)", en: "Standard Chartered Bank (Thai)" },
  { code: "017", short: "CITI", th: "ธนาคารซิตี้แบงก์", en: "Citibank" },
  { code: "031", short: "HSBC", th: "ธนาคารฮ่องกงและเซี่ยงไฮ้แบงกิ้งคอร์ปอเรชั่น จำกัด", en: "HSBC" },
];

/** Lowercase and drop spaces and punctuation. */
export function normalize(s: string): string {
  return s.toLowerCase().normalize("NFC").replace(/[\s.\-–_()&'’]/g, "");
}

/** A bank name as typed, plus forms without the generic words, so "กสิกร" matches "ธนาคารกสิกรไทย" and "kasikorn" matches "Kasikornbank". */
function variants(field: string): string[] {
  const full = normalize(field);
  return [full, full.replace(/ธนาคาร/g, ""), full.replace(/bank/g, "")].filter(Boolean);
}

/** Banks matching the query in Thai name, English name, short code or BOT code, best matches first. */
export function searchBanks(query: string, banks: Bank[] = THAI_BANKS): Bank[] {
  const q = normalize(query);
  if (!q) return banks;
  const scored: { bank: Bank; score: number }[] = [];
  for (const bank of banks) {
    let score = -1;
    for (const f of [bank.short, bank.code, bank.th, bank.en].flatMap(variants)) {
      if (f === q) score = Math.max(score, 100);
      else if (f.startsWith(q)) score = Math.max(score, 60);
      else if (f.includes(q)) score = Math.max(score, 30);
    }
    if (score >= 0) scored.push({ bank, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.bank.en.localeCompare(b.bank.en)).map((s) => s.bank);
}

export const findBankByName = (th: string | null | undefined, en?: string | null) =>
  THAI_BANKS.find((b) => (th && b.th === th) || (en && b.en === en));
