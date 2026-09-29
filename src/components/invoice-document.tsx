import type { ReactNode } from "react";
import { QrSvg } from "@/components/qr";
import type { DocumentView, Lang, Party } from "@/lib/document-view";
import { DOC_TYPE_LABEL } from "@/lib/sample-data";
import { bahtText } from "@/lib/thai/baht-text";
import { computeTotals, formatTHB, lineAmount } from "@/lib/thai/money";
import { promptPayPayload } from "@/lib/thai/promptpay";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";

export const A4 = { width: 794, height: 1123 } as const; // px at 96dpi

const ACCENT = "#0047ab"; // cobalt
const AMBER = "#ffb854";

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

const branchLabel = (code: string) =>
  code === "00000" ? { th: "สำนักงานใหญ่", en: "Head Office" } : { th: `สาขา ${code}`, en: `Branch ${code}` };

const qty = (milli: number) => String(milli / 1000);

function PartyBlock({ title, party, lang }: { title: ReactNode; party: Party; lang: Lang }) {
  const branch = branchLabel(party.branchCode);
  const name = lang === "en" ? party.nameEn ?? party.nameTh : party.nameTh;
  const address = lang === "en" ? party.addressEn ?? party.addressTh : party.addressTh;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>{title}</div>
      <div className="text-[13px] font-semibold leading-snug">{name}</div>
      {lang === "bilingual" && party.nameEn && <div className="text-[11px] text-neutral-600">{party.nameEn}</div>}
      {address && <div className="mt-1 text-[11px] leading-snug text-neutral-700">{address}</div>}
      {lang === "bilingual" && party.addressEn && <div className="text-[10.5px] leading-snug text-neutral-500">{party.addressEn}</div>}
      {party.taxId && (
        <div className="num mt-1 text-[11px] text-neutral-700">
          {lang === "en" ? "Tax ID" : lang === "th" ? "เลขประจำตัวผู้เสียภาษี" : "เลขประจำตัวผู้เสียภาษี (Tax ID)"}: {party.taxId} ·{" "}
          {lang === "en" ? branch.en : branch.th}
        </div>
      )}
    </div>
  );
}

export function InvoiceDocument({ doc }: { doc: DocumentView }) {
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
  const copyLabel = doc.copy === "copy" ? { th: "สำเนา", en: "Copy" } : { th: "ต้นฉบับ", en: "Original" };

  return (
    <div
      className="relative flex flex-col overflow-hidden bg-white p-12 text-[12px] leading-relaxed text-neutral-900"
      style={{ width: A4.width, height: A4.height, fontFamily: "var(--font-thai), var(--font-inter), sans-serif", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {doc.status === "draft" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="-rotate-[28deg] select-none whitespace-nowrap text-[84px] font-bold tracking-widest text-neutral-900/[0.06]">{lang === "en" ? "DRAFT" : lang === "th" ? "ฉบับร่าง" : "DRAFT · ฉบับร่าง"}</div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-start justify-between gap-6 border-b-4 pb-4" style={{ borderColor: ACCENT, boxShadow: `0 4px 0 ${AMBER}` }}>
        <div className="min-w-0">
          <div className="text-[22px] font-bold leading-tight" style={{ color: ACCENT }}>
            {lang === "en" ? label.en : label.th}
          </div>
          {lang === "bilingual" && <div className="text-[13px] font-semibold uppercase tracking-wide text-neutral-600">{label.en}</div>}
          <div className="mt-1 text-[10px] text-neutral-500">
            ({lang === "en" ? copyLabel.en : copyLabel.th}
            {lang === "bilingual" ? ` / ${copyLabel.en}` : ""})
          </div>
        </div>
        <dl className="num shrink-0 text-right text-[11px]">
          <div className="flex justify-end gap-2"><dt className="text-neutral-500"><T th="เลขที่" en="No." lang={lang === "bilingual" ? "th" : lang} />{lang === "bilingual" ? " / No." : ""}</dt><dd className="font-semibold">{doc.number ?? "— (draft)"}</dd></div>
          <div className="flex justify-end gap-2"><dt className="text-neutral-500"><T th="วันที่" en="Date" lang={lang === "bilingual" ? "th" : lang} />{lang === "bilingual" ? " / Date" : ""}</dt><dd>{date(doc.issueDate)}</dd></div>
          {doc.dueDate && <div className="flex justify-end gap-2"><dt className="text-neutral-500"><T th="ครบกำหนด" en="Due" lang={lang === "bilingual" ? "th" : lang} />{lang === "bilingual" ? " / Due" : ""}</dt><dd>{date(doc.dueDate)}</dd></div>}
        </dl>
      </header>

      {/* Parties */}
      <section className="mt-7 flex gap-8">
        <PartyBlock title={<T th="ผู้ขาย" en="Seller" lang={lang === "bilingual" ? "th" : lang} />} party={doc.seller} lang={lang} />
        <PartyBlock title={<T th="ผู้ซื้อ" en="Buyer" lang={lang === "bilingual" ? "th" : lang} />} party={doc.buyer} lang={lang} />
      </section>

      {/* Lines */}
      <table className="mt-5 w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="text-white" style={{ backgroundColor: ACCENT, boxShadow: `inset 0 -3px 0 ${AMBER}` }}>
            <th className="w-8 px-2 py-1.5 text-center font-medium">#</th>
            <th className="px-2 py-1.5 text-left font-medium"><T th="รายการ" en="Description" lang={lang} enClass="text-white/75" /></th>
            <th className="w-16 px-2 py-1.5 text-right font-medium"><T th="จำนวน" en="Qty" lang={lang} enClass="text-white/75" /></th>
            <th className="w-24 px-2 py-1.5 text-right font-medium"><T th="ราคา/หน่วย" en="Unit price" lang={lang} enClass="text-white/75" /></th>
            <th className="w-28 px-2 py-1.5 text-right font-medium"><T th="จำนวนเงิน" en="Amount" lang={lang} enClass="text-white/75" /></th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={i} className="border-b border-neutral-200 align-top">
              <td className="num px-2 py-2 text-center text-neutral-500">{i + 1}</td>
              <td className="px-2 py-2">
                {lang === "en" ? l.descriptionEn ?? l.descriptionTh : l.descriptionTh}
                {lang === "bilingual" && l.descriptionEn && <div className="text-[10.5px] text-neutral-500">{l.descriptionEn}</div>}
              </td>
              <td className="num px-2 py-2 text-right">{qty(l.qtyMilli)} {l.unit}</td>
              <td className="num px-2 py-2 text-right">{formatTHB(l.unitPrice)}</td>
              <td className="num px-2 py-2 text-right">{formatTHB(lineAmount(l))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals + payment */}
      <section className="mt-4 flex items-start justify-between gap-6">
        <div className="flex-1">
          {doc.notes && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500"><T th="หมายเหตุ" en="Notes" lang={lang === "bilingual" ? "th" : lang} /></div>
              <p className="whitespace-pre-line text-[11px] text-neutral-700">{doc.notes}</p>
            </div>
          )}
          {qrValue && (
            <div className="flex w-fit items-center gap-4 rounded-lg border-2 p-3 pr-5" style={{ borderColor: AMBER }}>
              <QrSvg value={qrValue} size={92} label="PromptPay QR code" />
              <div className="text-[11px] leading-snug">
                <div className="font-semibold"><T th="ชำระผ่านพร้อมเพย์" en="Pay with PromptPay" lang={lang} /></div>
                <div className="num mt-0.5 text-[15px] font-bold" style={{ color: ACCENT }}>฿{formatTHB(t.netReceivable)}</div>
                {t.wht > 0 && <div className="text-[10px] text-neutral-500"><T th="ยอดสุทธิหลังหักภาษี ณ ที่จ่าย" en="Net of withholding tax" lang={lang === "bilingual" ? "th" : lang} /></div>}
              </div>
            </div>
          )}
        </div>

        <dl className="num w-64 shrink-0 text-[11.5px]">
          <TotalRow k={<T th="รวมเป็นเงิน" en="Subtotal" lang={lang === "bilingual" ? "th" : lang} />} v={t.subtotal} />
          {t.discount > 0 && <TotalRow k={<T th="ส่วนลด" en="Discount" lang={lang === "bilingual" ? "th" : lang} />} v={-t.discount} />}
          <TotalRow k={<T th="ราคาก่อนภาษี" en="Amount before VAT" lang={lang === "bilingual" ? "th" : lang} />} v={t.taxable} />
          <TotalRow k={<>{lang === "en" ? "VAT" : "ภาษีมูลค่าเพิ่ม"} {doc.vatBps / 100}%</>} v={t.vat} />
          <div className="mt-1 border-t-2 pt-1" style={{ borderColor: AMBER }}>
            <TotalRow strong k={<T th="จำนวนเงินรวมทั้งสิ้น" en="Grand total" lang={lang === "bilingual" ? "th" : lang} />} v={t.total} />
          </div>
          {t.wht > 0 && (
            <>
              <TotalRow k={<>{lang === "en" ? "Withholding tax" : "หัก ณ ที่จ่าย"} {doc.whtBps / 100}%</>} v={-t.wht} />
              <TotalRow strong accent k={<T th="ยอดชำระสุทธิ" en="Net payable" lang={lang === "bilingual" ? "th" : lang} />} v={t.netReceivable} />
            </>
          )}
          <div className="mt-2 rounded bg-neutral-100 px-2 py-1 text-center text-[11px]">
            ({lang === "en" ? `THB ${formatTHB(t.total)}` : bahtText(t.total)})
          </div>
        </dl>
      </section>

      <div className="flex-1" />

      {/* Signatures */}
      <section className="grid grid-cols-2 gap-16 pb-6 pt-10 text-center text-[11px]">
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

      <footer className="flex items-center justify-between border-t border-neutral-200 pt-2 text-[9.5px] text-neutral-500">
        <span>{doc.seller.phone} · {doc.seller.email}</span>
        <span>{doc.status === "draft" ? "Draft · not a valid tax document" : "Electronically issued · verification code appears here once signed"}</span>
      </footer>
    </div>
  );
}

function TotalRow({ k, v, strong, accent }: { k: ReactNode; v: number; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-0.5 ${strong ? "text-[13px] font-bold" : ""}`} style={accent ? { color: ACCENT } : undefined}>
      <dt>{k}</dt>
      <dd>{v < 0 ? "−" : ""}{formatTHB(Math.abs(v))}</dd>
    </div>
  );
}
