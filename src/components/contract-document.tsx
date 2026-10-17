import type { ReactNode } from "react";
import { type Clause, type ContractFacts, fillTokens, stampDuty } from "@/lib/domain/contracts";
import type { CustomerSnapshot, SellerSnapshot, SignatorySnapshot } from "@/lib/domain/documents";
import { bahtText } from "@/lib/thai/baht-text";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";

// The service agreement as printed: flowing A4 pages (unlike invoices, a contract runs over several pages).
// Used by the editor preview, the print view, the signing page and the PDF.

export interface ContractView {
  number: string;
  status: "draft" | "sent" | "signed" | "void";
  lang: "th" | "en" | "bilingual";
  contractDate: string;
  place: string | null;
  start: string | null;
  end: string | null;
  clauses: Clause[];
  facts: ContractFacts;
  seller: SellerSnapshot;
  client: CustomerSnapshot;
  ownerSigner: SignatorySnapshot | null;
  contentHash: string | null;
  clientSignedAt: string | null;
  clientSignerName: string | null;
  clientSignature: string | null;
  signedVia: "online" | "paper" | null;
}

const INK = "#16202e";
const MUTED = "#6b7482";
const LINE = "#d9dde3";

export function ContractDocument({ c }: { c: ContractView }) {
  const th = c.lang !== "en";
  const en = c.lang !== "th";
  const both = th && en;
  const d = (iso: string) => (th ? formatDateTH(iso) : formatDateEN(iso));
  const tx = (t: string, e: string) => (
    <span>
      {th ? t : e}
      {both && <span style={{ color: MUTED }}> · {e}</span>}
    </span>
  );
  const party = (p: { name_th: string; name_en?: string | null; address_th?: string | null; address_en?: string | null; tax_id?: string | null; branch_code?: string }) => (
    <>
      <b>{th ? p.name_th : p.name_en || p.name_th}</b>
      {both && p.name_en && <span style={{ color: MUTED }}> ({p.name_en})</span>}
      {p.tax_id && <>, {th ? "เลขประจำตัวผู้เสียภาษี" : "tax ID"} {p.tax_id}{p.branch_code && p.branch_code !== "00000" ? ` ${th ? "สาขา" : "branch"} ${p.branch_code}` : ""}</>}
      {(th ? p.address_th : p.address_en || p.address_th) && <>, {th ? "ที่อยู่" : "address"} {th ? p.address_th : p.address_en || p.address_th}</>}
    </>
  );
  const duty = stampDuty(c.facts.taxable);

  return (
    <article className="contract mx-auto bg-white text-[12.5px] leading-[1.7]" style={{ color: INK, maxWidth: 794, padding: "48px 56px", fontFamily: "var(--font-plex), sans-serif" }}>
      <style>{`@media print { .contract { padding: 0 !important; max-width: none !important } .contract h2 { break-after: avoid } .contract .keep { break-inside: avoid } }`}</style>
      {(c.status === "draft" || c.status === "void") && (
        <div className="mb-4 rounded border px-3 py-1.5 text-center text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ borderColor: c.status === "void" ? "#dc2626" : LINE, color: c.status === "void" ? "#dc2626" : MUTED }}>
          {c.status === "void" ? (th ? "ยกเลิกแล้ว · VOID" : "VOID") : th ? "ฉบับร่างเพื่อตรวจทาน · DRAFT FOR REVIEW" : "DRAFT FOR REVIEW"}
        </div>
      )}

      <header className="keep flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[22px] leading-tight font-semibold">{th ? "สัญญาจ้างบริการ" : "Service agreement"}</h1>
          {both && <div className="text-[12px] tracking-[0.15em] uppercase" style={{ color: MUTED }}>Service agreement</div>}
          <div className="mt-2 text-[12px]" style={{ color: MUTED }}>
            {tx("เลขที่", "No.")} <b className="tabular-nums" style={{ color: INK }}>{c.number}</b> · {tx("ทำที่", "Made at")} {c.place || "—"} · {tx("วันที่", "Date")} {d(c.contractDate)}
          </div>
        </div>
        {c.signedVia !== "online" && duty > 0 && (
          <div className="shrink-0 rounded border border-dashed px-3 py-2 text-center text-[10.5px] leading-snug" style={{ borderColor: MUTED, color: MUTED, width: 120 }}>
            {th ? "ติดอากรแสตมป์" : "Stamp duty"}
            <div className="text-[15px] font-semibold tabular-nums" style={{ color: INK }}>฿{formatTHB(duty).replace(/\.00$/, "")}</div>
          </div>
        )}
      </header>

      <p className="mt-6">
        {th ? "สัญญานี้ทำขึ้นระหว่าง " : "This agreement is made between "}
        {party(c.client)}
        {th ? " ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้ว่าจ้าง” ฝ่ายหนึ่ง กับ " : ", the “Client”, and "}
        {party(c.seller)}
        {th ? " ซึ่งต่อไปในสัญญานี้เรียกว่า “ผู้รับจ้าง” อีกฝ่ายหนึ่ง คู่สัญญาตกลงกันดังต่อไปนี้" : ", the “Contractor”. The parties agree as follows."}
      </p>
      {both && (
        <p className="mt-1 text-[11.5px]" style={{ color: MUTED }}>
          This agreement is made between the Client and the Contractor named above. The parties agree as follows.
        </p>
      )}

      {c.clauses.map((cl, i) => (
        <section key={i} className="mt-5">
          <h2 className="keep text-[13.5px] font-semibold">
            {th ? "ข้อ" : "Clause"} {i + 1}. {tx(cl.title_th, cl.title_en)}
          </h2>
          {th && <p className="whitespace-pre-line">{fillTokens(cl.body_th, c.facts, c, "th")}</p>}
          {en && <p className="whitespace-pre-line" style={both ? { color: MUTED, fontSize: 11.5 } : undefined}>{fillTokens(cl.body_en, c.facts, c, "en")}</p>}
          {cl.kind === "scope" && <ScopeTable c={c} th={th} both={both} />}
          {cl.kind === "payment" && <ScheduleTable c={c} th={th} both={both} />}
        </section>
      ))}

      <Signatures c={c} th={th} both={both} />

      {c.contentHash && c.status !== "draft" && (
        <p className="mt-8 border-t pt-2 text-[9.5px] break-all" style={{ borderColor: LINE, color: MUTED }}>
          {th ? "รหัสตรวจสอบข้อความสัญญา (SHA-256)" : "Contract text fingerprint (SHA-256)"}: {c.contentHash}
        </p>
      )}
    </article>
  );
}

function Table({ head, rows, foot }: { head: ReactNode[]; rows: ReactNode[][]; foot?: ReactNode[] }) {
  return (
    <table className="keep mt-2 w-full border-collapse text-[11.5px]">
      <thead>
        <tr style={{ borderBottom: `1px solid ${INK}` }}>
          {head.map((h, i) => <th key={i} className={`py-1 font-semibold ${i === head.length - 1 ? "text-right" : "text-left"}`}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
            {r.map((x, j) => <td key={j} className={`py-1 align-top ${j === r.length - 1 ? "text-right tabular-nums" : ""}`}>{x}</td>)}
          </tr>
        ))}
      </tbody>
      {foot && (
        <tfoot>
          <tr>{foot.map((x, j) => <td key={j} className={`py-1 font-semibold ${j === foot.length - 1 ? "text-right tabular-nums" : ""}`}>{x}</td>)}</tr>
        </tfoot>
      )}
    </table>
  );
}

function ScopeTable({ c, th, both }: { c: ContractView; th: boolean; both: boolean }) {
  return (
    <Table
      head={[th ? "รายการ" : "Item", th ? "จำนวน" : "Qty", th ? "จำนวนเงิน (บาท)" : "Amount (THB)"]}
      rows={c.facts.lines.map((l) => [
        <>
          {th ? l.descriptionTh : l.descriptionEn || l.descriptionTh}
          {both && l.descriptionEn && <div style={{ color: MUTED }}>{l.descriptionEn}</div>}
        </>,
        `${l.qty} ${l.unit}`,
        formatTHB(l.amount),
      ])}
      foot={[th ? "รวมก่อนภาษีมูลค่าเพิ่ม" : "Total before VAT", "", formatTHB(c.facts.taxable)]}
    />
  );
}

function ScheduleTable({ c, th, both }: { c: ContractView; th: boolean; both: boolean }) {
  const rows = c.facts.schedule.length ? c.facts.schedule : [{ label: th ? "ชำระเต็มจำนวน · Full payment" : "Full payment", pctBps: 10000, amount: c.facts.taxable }];
  const vatOf = (a: number) => (c.facts.taxable ? Math.round((a * c.facts.vat) / c.facts.taxable) : 0);
  return (
    <>
      <Table
        head={[th ? "งวด" : "Instalment", th ? "สัดส่วน" : "Share", th ? "จำนวนเงินรวม VAT (บาท)" : "Amount incl. VAT (THB)"]}
        rows={rows.map((r, i) => [`${i + 1}. ${both ? r.label : th ? r.label.split("·")[0].trim() : (r.label.split("·")[1] ?? r.label).trim()}`, `${r.pctBps / 100}%`, formatTHB(r.amount + vatOf(r.amount))])}
        foot={[th ? "รวมทั้งสิ้น" : "Total", "", formatTHB(c.facts.total)]}
      />
      {th && <p className="mt-1 text-[11px]" style={{ color: MUTED }}>({bahtText(c.facts.total)})</p>}
    </>
  );
}

function Signatures({ c, th, both }: { c: ContractView; th: boolean; both: boolean }) {
  const when = (iso: string) => (th ? formatDateTH(iso.slice(0, 10)) : formatDateEN(iso.slice(0, 10)));
  const block = (role: string, roleEn: string, name: string | null | undefined, image: string | null | undefined, note: string | null) => (
    <div className="keep">
      <div className="flex h-16 items-end border-b" style={{ borderColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- signature image stored as a data URL */}
        {image && <img src={image} alt="" className="max-h-14 max-w-[75%] object-contain" />}
      </div>
      <div className="mt-1 text-[11.5px]">({name || "................................................"})</div>
      <div className="text-[11px]" style={{ color: MUTED }}>
        {th ? role : roleEn}
        {both && ` · ${roleEn}`}
        {note && <div>{note}</div>}
      </div>
    </div>
  );
  const ownerName = c.ownerSigner ? (th ? c.ownerSigner.name_th : c.ownerSigner.name_en || c.ownerSigner.name_th) : th ? c.seller.name_th : c.seller.name_en || c.seller.name_th;
  const clientNote = c.clientSignedAt
    ? `${c.signedVia === "online" ? (th ? "ลงนามอิเล็กทรอนิกส์เมื่อ" : "Signed electronically on") : th ? "ลงนามเมื่อ" : "Signed on"} ${when(c.clientSignedAt)}`
    : null;
  return (
    <section className="mt-10 grid grid-cols-2 gap-x-12 gap-y-8">
      {block("ผู้ว่าจ้าง", "Client", c.clientSignerName ?? (th ? c.client.name_th : c.client.name_en || c.client.name_th), c.clientSignature, clientNote)}
      {block("ผู้รับจ้าง", "Contractor", ownerName, c.status === "sent" || c.status === "signed" ? c.ownerSigner?.signature_image : null, null)}
      {c.signedVia !== "online" && (
        <>
          {block("พยาน", "Witness", null, null, null)}
          {block("พยาน", "Witness", null, null, null)}
        </>
      )}
    </section>
  );
}
