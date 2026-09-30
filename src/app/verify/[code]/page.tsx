import { LogoMark } from "@/components/logo";
import { GuillocheBackground, GuillocheBand, Microprint, Rosette, SerialNumber } from "@/components/banknote";
import { DOC_TYPE_LABEL } from "@/lib/domain/documents";
import { createClient } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";
import { HashCheck } from "./hash-check";

export const metadata = { title: "Verify document · Tra", robots: { index: false } };

export default async function Verify({ params }: PageProps<"/verify/[code]">) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = /^[a-z0-9]{8,32}$/.test(code) ? await supabase.rpc("verify_document", { p_code: code }) : { data: null };
  const doc = data?.[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden bg-cobalt-deep px-6 py-4 text-white">
        <GuillocheBackground tone="white" opacity={0.16} />
        <div className="relative flex items-center gap-3">
          <LogoMark size={42} title="" />
          <span className="display text-[24px] tracking-tight">Tra<span className="ml-1.5 font-sans text-[15px] text-amber">ตรา</span></span>
          <span className="text-xs text-amber">ตรวจสอบเอกสาร · Document verification</span>
        </div>
      </header>
      <GuillocheBand tone="amber" height={10} opacity={1} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {!doc ? (
          <section className="rounded-lg border border-destructive/40 bg-card p-8 text-center">
            <h1 className="display text-2xl text-destructive">Document not found · ไม่พบเอกสาร</h1>
            <p className="mt-2 text-muted-foreground">This verification code does not match any issued document. Check the link printed at the bottom of the document.</p>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-lg border border-cobalt/25 bg-paper">
            <GuillocheBackground opacity={0.08} />
            <Rosette size={220} tone="mono" opacity={0.14} className="absolute -top-14 -right-14" />
            <div className="relative p-8">
              <div className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold tracking-[0.1em] uppercase ${doc.status === "void" ? "border-destructive/60 text-destructive" : "border-ok/60 text-ok"}`}>
                {doc.status === "void" ? "Void · ยกเลิกแล้ว" : "Issued · ออกโดยผู้ประกอบการ"}
              </div>
              <h1 className="display mt-3 text-[30px]">{DOC_TYPE_LABEL[doc.doc_type].th} · {DOC_TYPE_LABEL[doc.doc_type].en}</h1>
              <div className="mt-1 text-lg"><SerialNumber value={doc.number} /></div>
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Issued · วันที่</dt><dd>{formatDateTH(doc.issue_date)} · {formatDateEN(doc.issue_date)}</dd>
                <dt className="text-muted-foreground">Seller · ผู้ขาย</dt><dd>{doc.seller_name} <span className="num text-muted-foreground">({doc.seller_tax_id})</span></dd>
                <dt className="text-muted-foreground">Buyer · ผู้ซื้อ</dt><dd>{doc.buyer_name}</dd>
                <dt className="text-muted-foreground">Total · ยอดรวม</dt><dd className="num font-semibold">฿{formatTHB(doc.total)} <span className="font-normal text-muted-foreground">(VAT ฿{formatTHB(doc.vat)})</span></dd>
                {doc.voided_at && (<><dt className="text-muted-foreground">Voided</dt><dd>{doc.voided_at.slice(0, 10)}</dd></>)}
                <dt className="text-muted-foreground">PDF SHA-256</dt><dd className="num break-all text-[12px]">{doc.pdf_sha256 ?? "Not signed yet"}</dd>
              </dl>
              {doc.pdf_sha256 && <HashCheck expected={doc.pdf_sha256} />}
            </div>
            <Microprint className="relative border-t border-cobalt/15 px-8 py-1" />
          </section>
        )}
      </main>
    </div>
  );
}
