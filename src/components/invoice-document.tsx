import type { ReactNode } from "react";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette, Seal, SerialNumber } from "@/components/banknote";
import { QrSvg } from "@/components/qr";
import type { DocumentView, Lang, Party } from "@/lib/document-view";
import { DOC_TYPE_LABEL } from "@/lib/sample-data";
import { bahtText } from "@/lib/thai/baht-text";
import { computeTotals, formatTHB, lineAmount } from "@/lib/thai/money";
import { promptPayPayload } from "@/lib/thai/promptpay";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";

export const A4 = { width: 794, height: 1123 } as const; // px at 96dpi

// Paper is always light, independent of the app's colour scheme.
const COBALT = "#0047ab";
const AMBER = "#ffb854";
const INK = "#1a2536";
const DISPLAY = "var(--font-serif), var(--font-serif-th), Georgia, serif";

/** Thai/English label pair, shown according to the document language. */
function T({ th, en, lang, enClass = "text-neutral-500" }: { th: string; en: string; lang: Lang; enClass?: string }) {
  if (lang === "th") return <>{th}</>;
  if (lang === "en") return <>{en}</>;
  return (
    <>
      {th}
      <span className={`block text-[0.82em] font-normal ${enClass}`}>{en}</span>
    </>
  );
}

/** Inline "ไทย / English" for short labels. */
const pair = (th: string, en: string, lang: Lang) => (lang === "th" ? th : lang === "en" ? en : `${th} / ${en}`);

const branchLabel = (code: string) =>
  code === "00000" ? { th: "สำนักงานใหญ่", en: "Head Office" } : { th: `สาขา ${code}`, en: `Branch ${code}` };

const qty = (milli: number) => String(milli / 1000);

function PartyBlock({ title, party, lang }: { title: string; party: Party; lang: Lang }) {
  const branch = branchLabel(party.branchCode);
  const name = lang === "en" ? party.nameEn ?? party.nameTh : party.nameTh;
  const address = lang === "en" ? party.addressEn ?? party.addressTh : party.addressTh;
  return (
    <div className="min-w-0 flex-1 border-l-2 pl-3" style={{ borderColor: AMBER }}>
      <div className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: COBALT }}>{title}</div>
      <div className="text-[13px] font-semibold leading-snug">{name}</div>
      {lang === "bilingual" && party.nameEn && <div className="text-[11px] text-neutral-600">{party.nameEn}</div>}
      {address && <div className="mt-1 text-[11px] leading-snug text-neutral-700">{address}</div>}
      {lang === "bilingual" && party.addressEn && <div className="text-[10.5px] leading-snug text-neutral-500">{party.addressEn}</div>}
      {party.taxId && (
        <div className="mt-1 text-[11px] tabular-nums text-neutral-700">
          {lang === "en" ? "Tax ID" : lang === "th" ? "เลขประจำตัวผู้เสียภาษี" : "เลขประจำตัวผู้เสียภาษี (Tax ID)"}: {party.taxId} ·{" "}
          {lang === "en" ? branch.en : branch.th}
        </div>
      )}
    </div>
  );
}

export function InvoiceDocument({ doc, idPrefix = "inv" }: { doc: DocumentView; idPrefix?: string }) {
  const { lang } = doc;
  const t = computeTotals({
    lines: doc.lines,
    discount: doc.discount,
    vatRegistered: true,
    vatBps: doc.vatBps,
    pricesIncludeVat: doc.pricesIncludeVat,
    whtBps: doc.whtBps,
  });
  const label = DOC_TYPE_LABEL[doc.type];
  const date = (iso: string) => (lang === "en" ? formatDateEN(iso) : formatDateTH(iso));
  const qrValue = doc.seller.promptPayId && t.netReceivable > 0 ? promptPayPayload(doc.seller.promptPayId, t.netReceivable) : null;
  const copyLabel = doc.copy === "copy" ? { th: "สำเนา", en: "COPY" } : { th: "ต้นฉบับ", en: "ORIGINAL" };
  const micro = `${label.en.toUpperCase()} · ${label.th} · ${doc.number ?? "DRAFT"} · ${doc.seller.taxId} · `;

  return (
    <div
      className="relative overflow-hidden bg-white text-[12px] leading-relaxed"
      style={{ width: A4.width, height: A4.height, color: INK, fontFamily: "var(--font-plex), sans-serif", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* Security frame: outer rule, microprint, inner rule. */}
      <div aria-hidden className="pointer-events-none absolute inset-[18px] border" style={{ borderColor: COBALT }} />
      <div aria-hidden className="pointer-events-none absolute inset-[23px] border-[0.5px]" style={{ borderColor: `${COBALT}99` }} />
      <Microprint text={micro} size={4.2} opacity={0.7} className="absolute inset-x-[26px] top-[25px]" />
      <Microprint text={micro} size={4.2} opacity={0.7} className="absolute inset-x-[26px] bottom-[25px]" />

      {/* Watermark rosette behind the body, very faint. */}
      <Rosette size={520} tone="mono" opacity={0.06} className="absolute top-[330px] left-1/2 -translate-x-1/2" />

      {doc.status === "draft" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-[28deg] select-none whitespace-nowrap text-[84px] font-bold tracking-widest text-neutral-900/[0.06]">{lang === "en" ? "DRAFT" : lang === "th" ? "ฉบับร่าง" : "DRAFT · ฉบับร่าง"}</div>
        </div>
      )}

      <div className="relative flex h-full flex-col px-12 pt-11 pb-10">
        {/* Header on guilloche paper */}
        <header className="relative -mx-4 overflow-hidden px-4 pt-2 pb-4">
          <GuillocheBackground opacity={0.08} />
          <div className="relative flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-[30px] leading-tight font-medium" style={{ color: COBALT, fontFamily: DISPLAY }}>
                {lang === "en" ? label.en : label.th}
              </div>
              {lang === "bilingual" && <div className="text-[12px] font-semibold tracking-[0.22em] text-neutral-600 uppercase">{label.en}</div>}
              <div className="mt-3 text-[11px] font-medium text-neutral-800">
                {lang === "en" ? doc.seller.nameEn ?? doc.seller.nameTh : doc.seller.nameTh}
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-4">
              <dl className="text-right text-[11px] tabular-nums">
                <dt className="text-[9.5px] tracking-[0.14em] text-neutral-500 uppercase">{pair("เลขที่", "No.", lang)}</dt>
                <dd className="mb-1.5 text-[15px] font-semibold">
                  {doc.number ? <SerialNumber value={doc.number} color={COBALT} emphasis={INK} /> : <span className="text-neutral-400">— {pair("ร่าง", "draft", lang)}</span>}
                </dd>
                <div className="flex justify-end gap-2"><dt className="text-neutral-500">{pair("วันที่", "Date", lang)}</dt><dd>{date(doc.issueDate)}</dd></div>
                {doc.dueDate && <div className="flex justify-end gap-2"><dt className="text-neutral-500">{pair("ครบกำหนด", "Due", lang)}</dt><dd>{date(doc.dueDate)}</dd></div>}
              </dl>
              <Seal
                id={`${idPrefix}-seal`}
                size={78}
                text={`${copyLabel.th} · ${copyLabel.en} · ${copyLabel.th} · ${copyLabel.en} · `}
                label={lang === "en" ? copyLabel.en.slice(0, 4) : copyLabel.th}
                color={COBALT}
                accent={AMBER}
              />
            </div>
          </div>
        </header>
        <GuillocheBand height={12} opacity={0.8} />
        <div className="h-[3px]" style={{ background: AMBER }} />

        {/* Parties */}
        <section className="mt-6 flex gap-8">
          <PartyBlock title={pair("ผู้ขาย", "Seller", lang)} party={doc.seller} lang={lang} />
          <PartyBlock title={pair("ผู้ซื้อ", "Buyer", lang)} party={doc.buyer} lang={lang} />
        </section>

        {/* Lines */}
        <table className="mt-6 w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="text-white" style={{ backgroundColor: COBALT, boxShadow: `inset 0 -3px 0 ${AMBER}` }}>
              <th className="w-8 px-2 py-1.5 text-center font-medium">#</th>
              <th className="px-2 py-1.5 text-left font-medium"><T th="รายการ" en="Description" lang={lang} enClass="text-white/75" /></th>
              <th className="w-16 px-2 py-1.5 text-right font-medium"><T th="จำนวน" en="Qty" lang={lang} enClass="text-white/75" /></th>
              <th className="w-24 px-2 py-1.5 text-right font-medium"><T th="ราคา/หน่วย" en="Unit price" lang={lang} enClass="text-white/75" /></th>
              <th className="w-28 px-2 py-1.5 text-right font-medium"><T th="จำนวนเงิน" en="Amount" lang={lang} enClass="text-white/75" /></th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={i} className="border-b border-dashed border-neutral-300 align-top">
                <td className="num px-2 py-2 text-center text-neutral-500">{i + 1}</td>
                <td className="px-2 py-2">
                  {lang === "en" ? l.descriptionEn ?? l.descriptionTh : l.descriptionTh}
                  {lang === "bilingual" && l.descriptionEn && <div className="text-[10.5px] text-neutral-500">{l.descriptionEn}</div>}
                </td>
                <td className="px-2 py-2 text-right"><span className="num">{qty(l.qtyMilli)}</span> {l.unit}</td>
                <td className="num px-2 py-2 text-right">{formatTHB(l.unitPrice)}</td>
                <td className="num px-2 py-2 text-right">{formatTHB(lineAmount(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + payment */}
        <section className="mt-5 flex items-start justify-between gap-6">
          <div className="flex-1">
            {doc.notes && (
              <div className="mb-3">
                <div className="text-[9.5px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">{pair("หมายเหตุ", "Notes", lang)}</div>
                <p className="whitespace-pre-line text-[11px] text-neutral-700">{doc.notes}</p>
              </div>
            )}
            {qrValue && (
              <div className="w-fit overflow-hidden rounded-md border" style={{ borderColor: AMBER }}>
                <GuillocheBand tone="amber" height={7} opacity={1} />
                <div className="flex items-center gap-4 bg-white p-3 pr-5">
                  <QrSvg value={qrValue} size={92} label="PromptPay QR code" />
                  <div className="text-[11px] leading-snug">
                    <div className="font-semibold"><T th="ชำระผ่านพร้อมเพย์" en="Pay with PromptPay" lang={lang} /></div>
                    <div className="num mt-0.5 text-[15px] font-bold" style={{ color: COBALT }}>฿{formatTHB(t.netReceivable)}</div>
                    {t.wht > 0 && <div className="text-[10px] text-neutral-500">{pair("ยอดสุทธิหลังหักภาษี ณ ที่จ่าย", "Net of withholding tax", lang === "bilingual" ? "th" : lang)}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-72 shrink-0">
            <dl className="px-1 text-[11.5px]">
              <TotalRow k={pair("รวมเป็นเงิน", "Subtotal", lang === "bilingual" ? "th" : lang)} v={t.subtotal} />
              {t.discount > 0 && <TotalRow k={pair("ส่วนลด", "Discount", lang === "bilingual" ? "th" : lang)} v={-t.discount} />}
              <TotalRow k={pair("ราคาก่อนภาษี", "Amount before VAT", lang === "bilingual" ? "th" : lang)} v={t.taxable} />
              <TotalRow k={<>{lang === "en" ? "VAT" : "ภาษีมูลค่าเพิ่ม"} {doc.vatBps / 100}%</>} v={t.vat} />
            </dl>
            {/* Grand total printed like the face value of a note. */}
            <div className="relative mt-2 overflow-hidden rounded-md border px-3 py-2.5" style={{ borderColor: `${COBALT}55`, background: "#fffdf7" }}>
              <GuillocheBackground opacity={0.1} />
              <div className="relative flex items-baseline justify-between gap-3">
                <div className="text-[11px] font-semibold"><T th="จำนวนเงินรวมทั้งสิ้น" en="Grand total" lang={lang} /></div>
                <div className="num text-[19px] font-semibold" style={{ color: COBALT }}>{formatTHB(t.total)}</div>
              </div>
              <div className="relative mt-1 text-right text-[10.5px] text-neutral-700">
                ({lang === "en" ? `THB ${formatTHB(t.total)}` : bahtText(t.total)})
              </div>
            </div>
            {t.wht > 0 && (
              <dl className="mt-1.5 px-1 text-[11.5px]">
                <TotalRow k={<>{lang === "en" ? "Withholding tax" : "หัก ณ ที่จ่าย"} {doc.whtBps / 100}%</>} v={-t.wht} />
                <TotalRow strong accent k={pair("ยอดชำระสุทธิ", "Net payable", lang === "bilingual" ? "th" : lang)} v={t.netReceivable} />
              </dl>
            )}
          </div>
        </section>

        <div className="flex-1" />

        {/* Signatures */}
        <section className="grid grid-cols-2 gap-16 pt-10 pb-5 text-center text-[11px]">
          {[
            { th: "ผู้รับสินค้า/บริการ", en: "Received by" },
            { th: "ผู้ออกเอกสาร", en: "Authorized signature" },
          ].map((s) => (
            <div key={s.en}>
              <div className="mb-1 h-10 border-b border-neutral-400" />
              <T th={s.th} en={s.en} lang={lang} />
              <div className="mt-1 text-[10px] text-neutral-400">วันที่ / Date ____/____/______</div>
            </div>
          ))}
        </section>

        <footer className="flex items-center justify-between border-t pt-2 text-[9.5px] text-neutral-500" style={{ borderColor: `${COBALT}40` }}>
          <span>{doc.seller.phone} · {doc.seller.email}</span>
          <span>{doc.status === "draft" ? "Draft · not a valid tax document" : "Electronically issued · verification code appears here once signed"}</span>
        </footer>
      </div>
    </div>
  );
}

function TotalRow({ k, v, strong, accent }: { k: ReactNode; v: number; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-0.5 ${strong ? "text-[13px] font-bold" : ""}`} style={accent ? { color: COBALT } : undefined}>
      <dt>{k}</dt>
      <dd className="num">{v < 0 ? "−" : ""}{formatTHB(Math.abs(v))}</dd>
    </div>
  );
}
