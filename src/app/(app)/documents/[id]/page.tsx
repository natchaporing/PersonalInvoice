import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { A4, InvoiceDocument } from "@/components/invoice-document";
import { ScaledPage } from "@/components/scaled-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocumentBundle, paidAmount } from "@/lib/data/documents";
import { DOC_TYPE_LABEL, isAdjustment, isOverdue, isPayable, isTaxDocument, todayBangkok } from "@/lib/domain/documents";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { DocumentActions } from "./document-actions";
import { type CertRow, type PaymentRow, PaymentsPanel, WhtPanel } from "./panels";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const bundle = await getDocumentBundle(supabase, id, user.id);
  if (!bundle) notFound();
  const { doc, view, payments, certificates, ref } = bundle;
  const today = todayBangkok();

  // Short-lived links to private files.
  const sign = async (path: string | null) =>
    path ? (await supabase.storage.from("documents").createSignedUrl(path, 600, { download: path.endsWith(".pdf") && path.includes("/documents/") })).data?.signedUrl ?? null : null;
  const [pdfUrl, paymentRows, certRows] = await Promise.all([
    sign(doc.pdf_path),
    Promise.all(payments.map(async (p): Promise<PaymentRow> => ({ ...p, slipUrl: await sign(p.slip_path) }))),
    Promise.all(certificates.map(async (c): Promise<CertRow> => ({ ...c, fileUrl: await sign(c.file_path) }))),
  ]);
  const paid = paidAmount(payments);
  const { data: adjustments } = await supabase.from("documents").select("id, number, doc_type, status, total").eq("ref_document_id", id);

  return (
    <>
      <PageHeader
        eyebrow={`${DOC_TYPE_LABEL[doc.doc_type].th} · ${DOC_TYPE_LABEL[doc.doc_type].en}`}
        title={doc.number ?? "Draft"}
        subtitle={`${view.buyer.nameTh} · ฿${formatTHB(doc.total)}`}
        actions={<StatusBadge status={doc.status} overdue={isOverdue(doc, today)} />}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <DocumentActions
            id={id}
            status={doc.status}
            type={doc.doc_type}
            pdfUrl={pdfUrl}
            canAdjust={isTaxDocument(doc.doc_type) && !isAdjustment(doc.doc_type)}
            hasPayments={payments.length > 0}
          />

          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Issue date</dt><dd>{doc.issue_date}</dd>
                {doc.due_date && (<><dt className="text-muted-foreground">Due date</dt><dd>{doc.due_date}</dd></>)}
                <dt className="text-muted-foreground">Before VAT</dt><dd className="num">฿{formatTHB(doc.taxable)}</dd>
                <dt className="text-muted-foreground">VAT {doc.vat_bps / 100}%</dt><dd className="num">฿{formatTHB(doc.vat)}</dd>
                <dt className="text-muted-foreground">Total</dt><dd className="num font-semibold">฿{formatTHB(doc.total)}</dd>
                {doc.wht > 0 && (<><dt className="text-muted-foreground">Withholding {doc.wht_bps / 100}%</dt><dd className="num">−฿{formatTHB(doc.wht)}</dd></>)}
                {isPayable(doc.doc_type) && (<><dt className="text-muted-foreground">Net receivable</dt><dd className="num font-semibold text-cobalt">฿{formatTHB(doc.net_receivable)}</dd></>)}
                {ref && (<><dt className="text-muted-foreground">Adjusts</dt><dd><Link href={`/documents/${ref.id}`} className="text-cobalt underline"><SerialNumber value={ref.number ?? "—"} /></Link></dd></>)}
                {doc.reason && (<><dt className="text-muted-foreground">Reason</dt><dd>{doc.reason}</dd></>)}
                {doc.pdf_sha256 && (<><dt className="text-muted-foreground">PDF SHA-256</dt><dd className="num break-all text-[12px]">{doc.pdf_sha256}</dd></>)}
                {doc.verify_code && (<><dt className="text-muted-foreground">Verification</dt><dd><Link href={`/verify/${doc.verify_code}`} className="text-cobalt underline">/verify/{doc.verify_code}</Link></dd></>)}
              </dl>
              {adjustments && adjustments.length > 0 && (
                <div className="mt-4 border-t pt-3 text-sm">
                  <div className="eyebrow mb-1">Adjusted by</div>
                  {adjustments.map((a) => (
                    <div key={a.id} className="flex justify-between gap-3">
                      <Link href={`/documents/${a.id}`} className="text-cobalt underline">{a.number ?? "Draft"} · {DOC_TYPE_LABEL[a.doc_type].en}</Link>
                      <span className="num">฿{formatTHB(a.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isPayable(doc.doc_type) && doc.status !== "draft" && doc.status !== "void" && (
            <PaymentsPanel documentId={id} payments={paymentRows} netReceivable={doc.net_receivable} paid={paid} today={today} open={doc.status === "issued"} />
          )}
          {doc.wht > 0 && doc.status !== "draft" && doc.status !== "void" && (
            <WhtPanel documentId={id} certificates={certRows} expectedWht={doc.wht} taxable={doc.taxable} today={today} />
          )}
        </div>

        <aside aria-label="Document" className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-md border bg-white shadow-[0_1px_0_var(--border),0_14px_34px_-18px_rgb(26_37_54/0.4)]">
            <ScaledPage width={A4.width} height={A4.height}>
              <InvoiceDocument doc={view} idPrefix="detail" verifyBaseUrl={process.env.APP_URL} />
            </ScaledPage>
          </div>
        </aside>
      </div>
    </>
  );
}
