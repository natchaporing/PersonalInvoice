import type { ReactNode } from "react";
import { Qr } from "@/components/qr";
import type { DocumentView, Lang, Party, Signatory } from "@/lib/document-view";
import { DOC_TYPE_LABEL, showsBankDetails } from "@/lib/domain/documents";
import { bahtText } from "@/lib/thai/baht-text";
import { formatBankAccount } from "@/lib/thai/bank";
import { computeTotals, formatTHB, lineNet } from "@/lib/thai/money";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";
import { cn } from "@/lib/utils";

// Document layout used for previews, the print view and signed PDFs ("clean"). /preview/styles compares the variants
// and the earlier Banknote layout (InvoiceDocument).
// Same data as InvoiceDocument (DocumentView), same A4 size, colours from the active palette.

export type ModernVariant = "clean" | "band" | "mono";

const A4 = { width: 794, height: 1123 } as const;
const INK = "#16202e";
const MUTED = "#6b7482";
const LINE = "#e3e6eb";

const pair = (th: string, en: string, lang: Lang) => (lang === "th" ? th : lang === "en" ? en : `${th} · ${en}`);
const branchText = (code: string, lang: Lang) =>
  code === "00000" ? pair("สำนักงานใหญ่", "Head office", lang) : pair(`สาขา ${code}`, `Branch ${code}`, lang);

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[9.5px] font-semibold tracking-[0.03em] uppercase", className)} style={{ color: MUTED }}>{children}</div>;
}

function PartyText({ party, lang, strong = true }: { party: Party; lang: Lang; strong?: boolean }) {
  const name = lang === "en" ? party.nameEn ?? party.nameTh : party.nameTh;
  const address = lang === "en" ? party.addressEn ?? party.addressTh : party.addressTh;
  return (
    <div className="text-[11px] leading-[1.55]" style={{ color: INK }}>
      <div className={cn(strong ? "text-[13.5px] font-semibold" : "font-medium")}>{name}</div>
      {lang === "bilingual" && party.nameEn && <div style={{ color: MUTED }}>{party.nameEn}</div>}
      {address && <div className="mt-1">{address}</div>}
      {lang === "bilingual" && party.addressEn && <div style={{ color: MUTED }}>{party.addressEn}</div>}
      {party.taxId && (
        <div className="mt-1 tabular-nums" style={{ color: MUTED }}>
          {pair("เลขประจำตัวผู้เสียภาษี", "Tax ID", lang === "bilingual" ? "en" : lang)} {party.taxId} · {branchText(party.branchCode, lang === "bilingual" ? "th" : lang)}
        </div>
      )}
      {(party.phone || party.email) && <div style={{ color: MUTED }}>{[party.phone, party.email].filter(Boolean).join(" · ")}</div>}
    </div>
  );
}

function Sign({ heading, who, date, lang }: { heading: string; who?: Signatory; date?: string; lang: Lang }) {
  const name = who ? (lang === "en" ? who.nameEn ?? who.nameTh : who.nameTh) : undefined;
  const title = who ? (lang === "en" ? who.titleEn ?? who.titleTh : who.titleTh) : undefined;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex h-11 items-end border-b" style={{ borderColor: INK }}>
        {who?.signatureImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={who.signatureImage} alt="" className="max-h-10 max-w-[70%] object-contain" />
        )}
      </div>
      <div className="mt-1.5 text-[10.5px] font-medium" style={{ color: INK }}>{name ?? heading}</div>
      <div className="text-[9.5px]" style={{ color: MUTED }}>
        {name ? [title, heading].filter(Boolean).join(" · ") : null}
        {date ? `${name ? " · " : ""}${date}` : name ? "" : pair("วันที่ ____/____/______", "Date ____/____/______", lang === "bilingual" ? "th" : lang)}
      </div>
    </div>
  );
}

export function InvoiceModern({ doc, variant = "clean", verifyBaseUrl }: { doc: DocumentView; variant?: ModernVariant; verifyBaseUrl?: string }) {
  const { lang } = doc;
  const t = computeTotals({ lines: doc.lines, discount: doc.discount, vatRegistered: true, vatBps: doc.vatBps, pricesIncludeVat: doc.pricesIncludeVat, whtBps: doc.whtBps });
  const label = DOC_TYPE_LABEL[doc.type];
  const date = (iso: string) => (lang === "en" ? formatDateEN(iso) : formatDateTH(iso));
  const brand = variant === "mono" ? INK : "var(--cobalt)";
  const accent = variant === "mono" ? INK : "var(--amber)";
  const hasDiscount = doc.lines.some((l) => l.discount > 0);
  const mixedVat = new Set(doc.lines.map((l) => l.vatBps)).size > 1;
  const totalDiscount = t.lineDiscount + t.discount;
  const bank = showsBankDetails(doc.type) && t.netReceivable > 0 ? doc.seller.bank : undefined;
  const verifyUrl = doc.verifyCode && verifyBaseUrl ? `${verifyBaseUrl.replace(/\/$/, "")}/verify/${doc.verifyCode}` : undefined;
  const sub = lang === "bilingual" ? "th" : lang;
  const copy = doc.copy === "copy" ? pair("สำเนา", "Copy", lang) : pair("ต้นฉบับ", "Original", lang);
  const seller = doc.seller;
  const sellerName = lang === "en" ? seller.nameEn ?? seller.nameTh : seller.nameTh;

  const meta: { k: string; v: string }[] = [
    { k: pair("เลขที่", "Number", lang), v: doc.number ?? pair("ฉบับร่าง", "Draft", sub) },
    { k: pair("วันที่", "Date", lang), v: date(doc.issueDate) },
    ...(doc.dueDate ? [{ k: pair("ครบกำหนด", "Due", lang), v: date(doc.dueDate) }] : []),
    ...(doc.validUntil ? [{ k: pair("ใช้ได้ถึง", "Valid until", lang), v: date(doc.validUntil) }] : []),
    ...(doc.replyBy ? [{ k: pair("ตอบรับภายใน", "Reply by", lang), v: date(doc.replyBy) }] : []),
    ...(doc.refNumber ? [{ k: pair("อ้างอิง", "Reference", lang), v: doc.refNumber }] : []),
  ];

  const titleBlock = (onBrand: boolean) => (
    <div className="text-right">
      <div className="text-[26px] leading-tight font-semibold tracking-tight" style={{ color: onBrand ? "#fff" : brand }}>
        {lang === "en" ? label.en : label.th}
      </div>
      {lang === "bilingual" && <div className="text-[11px] font-medium tracking-[0.2em] uppercase" style={{ color: onBrand ? "rgb(255 255 255 / 0.75)" : MUTED }}>{label.en}</div>}
      <div className="mt-2 inline-block rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] uppercase" style={onBrand ? { borderColor: "rgb(255 255 255 / 0.5)", color: "#fff" } : { borderColor: LINE, color: MUTED }}>
        {copy}
      </div>
    </div>
  );

  return (
    <div
      className="relative flex flex-col overflow-hidden bg-white text-[11px]"
      style={{ width: A4.width, height: A4.height, color: INK, fontFamily: "var(--font-plex), sans-serif", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {(doc.status === "draft" || doc.status === "void") && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className={cn("-rotate-[24deg] text-[120px] font-bold tracking-[0.2em]", doc.status === "void" ? "text-red-600/15" : "text-neutral-900/[0.045]")}>
            {doc.status === "void" ? "VOID" : "DRAFT"}
          </div>
        </div>
      )}

      {/* Header */}
      {variant === "band" ? (
        <header className="flex items-start justify-between px-14 pt-11 pb-8" style={{ background: brand }}>
          <div className="text-white">
            <div className="text-[18px] font-semibold">{sellerName}</div>
            {lang === "bilingual" && seller.nameEn && <div className="text-[11px] text-white/75">{seller.nameEn}</div>}
          </div>
          {titleBlock(true)}
        </header>
      ) : (
        <>
          <div className="h-1.5" style={{ background: variant === "mono" ? INK : `linear-gradient(90deg, ${brand} 0 72%, ${accent} 72% 100%)` }} />
          <header className="flex items-start justify-between px-14 pt-10 pb-6">
            <div>
              <div className="text-[18px] font-semibold" style={{ color: INK }}>{sellerName}</div>
              {lang === "bilingual" && seller.nameEn && <div className="text-[11px]" style={{ color: MUTED }}>{seller.nameEn}</div>}
            </div>
            {titleBlock(false)}
          </header>
        </>
      )}

      <div className="flex flex-1 flex-col px-14" style={{ paddingTop: variant === "band" ? 28 : 4 }}>
        {/* Parties + meta */}
        <section className="grid grid-cols-[1fr_1fr_236px] gap-8">
          <div>
            <Label className="mb-1.5">{pair("ผู้ขาย", "From", lang)}</Label>
            <PartyText party={seller} lang={lang} strong={false} />
          </div>
          <div>
            <Label className="mb-1.5">{pair("ผู้ซื้อ", "Bill to", lang)}</Label>
            <PartyText party={doc.buyer} lang={lang} />
          </div>
          <dl className="grid grid-cols-[auto_1fr] content-start self-start gap-x-4 gap-y-1.5 rounded-lg px-4 py-3" style={{ background: "color-mix(in srgb, var(--cobalt) 5%, #f7f8fa)" }}>
            {meta.map((m) => (
              <div key={m.k} className="contents">
                <dt className="text-[9.5px] leading-[18px]" style={{ color: MUTED }}>{m.k}</dt>
                <dd className={cn("text-right tabular-nums", m === meta[0] ? "text-[13px] font-semibold" : "font-medium")} style={m === meta[0] ? { color: brand } : undefined}>{m.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Lines */}
        <table className="mt-8 w-full border-collapse text-[11px]">
          <thead>
            <tr className="text-left" style={{ borderBottom: `1.5px solid ${INK}` }}>
              {[
                { k: "#", w: "w-7" },
                ...(doc.showProductCode ? [{ k: pair("รหัส", "Code", sub), w: "w-20" }] : []),
                { k: pair("รายการ", "Description", lang), w: "" },
                { k: pair("จำนวน", "Qty", sub), w: "w-14 text-right" },
                ...(doc.showUnit ? [{ k: pair("หน่วย", "Unit", sub), w: "w-14 pl-2" }] : []),
                { k: pair("ราคา/หน่วย", "Price", sub), w: "w-24 text-right" },
                ...(hasDiscount ? [{ k: pair("ส่วนลด", "Disc.", sub), w: "w-20 text-right" }] : []),
                ...(mixedVat ? [{ k: "VAT", w: "w-11 text-right" }] : []),
                { k: pair("จำนวนเงิน", "Amount", sub), w: "w-28 text-right" },
              ].map((h) => (
                <th key={h.k} className={cn("pb-2 text-[9.5px] font-semibold tracking-[0.03em] uppercase", h.w)} style={{ color: MUTED }}>{h.k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={i} className="align-top" style={{ borderBottom: `1px solid ${LINE}` }}>
                <td className="py-2.5 tabular-nums" style={{ color: MUTED }}>{String(i + 1).padStart(2, "0")}</td>
                {doc.showProductCode && <td className="py-2.5 text-[10px] tabular-nums" style={{ color: MUTED }}>{l.code}</td>}
                <td className="py-2.5 pr-3">
                  <div className="font-medium">{lang === "en" ? l.descriptionEn ?? l.descriptionTh : l.descriptionTh}</div>
                  {lang === "bilingual" && l.descriptionEn && <div className="text-[10px]" style={{ color: MUTED }}>{l.descriptionEn}</div>}
                </td>
                <td className="py-2.5 text-right tabular-nums">{l.qtyMilli / 1000}</td>
                {doc.showUnit && <td className="py-2.5 pl-2" style={{ color: MUTED }}>{l.unit}</td>}
                <td className="py-2.5 text-right tabular-nums">{formatTHB(l.unitPrice)}</td>
                {hasDiscount && <td className="py-2.5 text-right tabular-nums" style={{ color: MUTED }}>{l.discount ? `−${formatTHB(l.discount)}` : "—"}</td>}
                {mixedVat && <td className="py-2.5 text-right tabular-nums" style={{ color: MUTED }}>{l.vatBps / 100}%</td>}
                <td className="py-2.5 text-right font-medium tabular-nums">{formatTHB(lineNet(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Payment + totals */}
        <section className="mt-6 grid grid-cols-[1fr_272px] gap-10">
          <div className="space-y-4">
            {doc.reason && (
              <div>
                <Label className="mb-1">{pair("เหตุผล", "Reason", lang)}</Label>
                <div>{doc.reason}</div>
              </div>
            )}
            {bank && (
              <div className="rounded-lg border px-4 py-3" style={{ borderColor: LINE }}>
                <Label className="mb-2">{pair("ชำระโดยโอนเงิน", "Pay by bank transfer", lang)}</Label>
                <div className="font-medium">{lang === "en" ? bank.bankEn ?? bank.bankTh : bank.bankTh}{lang === "bilingual" && bank.bankEn ? ` · ${bank.bankEn}` : ""}</div>
                <div className="mt-0.5 text-[15px] font-semibold tracking-wide tabular-nums" style={{ color: brand }}>{formatBankAccount(bank.accountNumber)}</div>
                <div style={{ color: MUTED }}>
                  {lang === "en" ? bank.accountNameEn ?? bank.accountName : bank.accountName}
                  {bank.accountType && ` · ${bank.accountType === "savings" ? pair("ออมทรัพย์", "Savings", sub) : pair("กระแสรายวัน", "Current", sub)}`}
                </div>
              </div>
            )}
            {doc.notes && (
              <div>
                <Label className="mb-1">{pair("หมายเหตุ", "Notes", lang)}</Label>
                <p className="whitespace-pre-line" style={{ color: "#3a4452" }}>{doc.notes}</p>
              </div>
            )}
          </div>

          <div>
            <dl className="space-y-1.5 tabular-nums">
              <Row k={pair("รวมเป็นเงิน", "Subtotal", sub)} v={formatTHB(t.subtotal + t.lineDiscount)} />
              {totalDiscount > 0 && <Row k={pair("ส่วนลด", "Discount", sub)} v={`−${formatTHB(totalDiscount)}`} />}
              <Row k={pair("ก่อนภาษี", "Before VAT", sub)} v={formatTHB(t.taxable)} />
              {t.vatGroups.filter((g) => g.bps > 0).map((g) => (
                <Row key={g.bps} k={`${pair("ภาษีมูลค่าเพิ่ม", "VAT", sub)} ${g.bps / 100}%`} v={formatTHB(g.vat)} />
              ))}
              {t.vatGroups.length > 1 && t.vatGroups.some((g) => g.bps === 0) && (
                <Row k={pair("ยอด 0% / ยกเว้นภาษี", "0% / exempt", sub)} v={formatTHB(t.vatGroups.find((g) => g.bps === 0)!.taxable)} />
              )}
            </dl>
            <div className="mt-3 border-t-2 pt-3" style={{ borderColor: INK }}>
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{pair("รวมทั้งสิ้น", "Total", sub)}</span>
                <span className="text-[24px] font-semibold tracking-tight tabular-nums" style={{ color: brand }}>฿{formatTHB(t.total)}</span>
              </div>
              <div className="mt-0.5 text-right text-[10px]" style={{ color: MUTED }}>{lang === "en" ? `THB ${formatTHB(t.total)}` : `(${bahtText(t.total)})`}</div>
            </div>
            {t.wht > 0 && (
              <dl className="mt-3 space-y-1.5 rounded-lg px-3 py-2.5 tabular-nums" style={{ background: "#f7f8fa" }}>
                <Row k={`${pair("หัก ณ ที่จ่าย", "Withholding", sub)} ${doc.whtBps / 100}%`} v={`−${formatTHB(t.wht)}`} />
                <div className="flex justify-between font-semibold" style={{ color: brand }}>
                  <dt>{pair("ยอดชำระสุทธิ", "Net payable", sub)}</dt>
                  <dd>฿{formatTHB(t.netReceivable)}</dd>
                </div>
              </dl>
            )}
          </div>
        </section>

        <div className="flex-1" />

        {/* Signatures */}
        <section className="flex gap-10 pb-6">
          <Sign heading={doc.type === "quotation" ? pair("ผู้ตอบรับ", "Accepted by", sub) : pair("ผู้รับสินค้า/บริการ", "Received by", sub)} lang={lang} />
          <Sign heading={pair("ผู้ออกเอกสาร", "Issued by", sub)} who={doc.signer} date={doc.signer ? date(doc.issueDate) : undefined} lang={lang} />
          {doc.approver && <Sign heading={pair("ผู้อนุมัติ", "Approved by", sub)} who={doc.approver} date={date(doc.issueDate)} lang={lang} />}
        </section>
      </div>

      <footer className="flex items-center justify-between gap-6 px-14 py-4 text-[9px]" style={{ borderTop: `1px solid ${LINE}`, color: MUTED }}>
        <div className="flex items-center gap-3">
          {verifyUrl && <Qr value={verifyUrl} size={46} color={INK} label="Open this document online" />}
          <div className="leading-snug">
            {verifyUrl ? (
              <>
                <div className="font-medium" style={{ color: INK }}>{pair("สแกนเพื่อตรวจสอบเอกสาร", "Scan to verify", sub)}</div>
                <div className="tabular-nums">{verifyUrl.replace(/^https?:\/\//, "")}</div>
              </>
            ) : doc.status === "draft" ? (
              pair("ฉบับร่าง · ยังไม่ใช่เอกสารทางภาษี", "Draft · not a valid tax document", sub)
            ) : (
              pair("ออกเอกสารทางอิเล็กทรอนิกส์", "Electronically issued", sub)
            )}
          </div>
        </div>
        <div>{lang === "th" ? "ออกเอกสารด้วย Tra" : "Issued with Tra · trasolutions.co"}</div>
      </footer>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: MUTED }}>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
