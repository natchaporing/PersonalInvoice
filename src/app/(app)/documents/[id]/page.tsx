import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { PreviewFrame } from "@/components/preview-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDocumentBundle, getProfile, paidAmount } from "@/lib/data/documents";
import { DOC_TYPE_LABEL, isAdjustment, isOverdue, isPayable, isTaxDocument, todayBangkok } from "@/lib/domain/documents";
import { installmentStage } from "@/lib/domain/installments";
import { prepareEtaxInput } from "@/lib/etax/prepare";
import { isEtaxDocType } from "@/lib/etax/xml";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";
import { DocumentActions } from "./document-actions";
import { CommissionPanel } from "./commission-panel";
import { EtaxPanel } from "./etax-panel";
import { type InstallmentRow, InstallmentsPanel } from "./installments-panel";
import { type CertRow, type PaymentRow, PaymentsPanel, WhtPanel } from "./panels";

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const bundle = await getDocumentBundle(supabase, id, user.id);
  if (!bundle) notFound();
  const { doc, view, payments, certificates, ref } = bundle;
  const today = todayBangkok();
  const etaxProfile = isEtaxDocType(doc.doc_type) ? await getProfile(supabase, user.id) : null;

  // Short-lived links to private files.
  const sign = async (path: string | null) =>
    path ? (await supabase.storage.from("documents").createSignedUrl(path, 600, { download: path.endsWith(".pdf") && path.includes("/documents/") })).data?.signedUrl ?? null : null;
  const signDownload = async (path: string | null) => (path ? (await supabase.storage.from("documents").createSignedUrl(path, 600, { download: true })).data?.signedUrl ?? null : null);
  const showEtax = isEtaxDocType(doc.doc_type) && (doc.status === "issued" || doc.status === "paid");
  const etaxProblems = showEtax
    ? (() => {
        const r = prepareEtaxInput({ doc, lines: bundle.lines, customer: bundle.customer, profile: etaxProfile, ref: bundle.ref });
        return "problems" in r ? r.problems : [];
      })()
    : [];
  const [pdfUrl, etaxXmlUrl, etaxPdfUrl, paymentRows, certRows] = await Promise.all([
    sign(doc.pdf_path),
    signDownload(doc.etax_xml_path),
    signDownload(doc.etax_pdf_path),
    Promise.all(payments.map(async (p): Promise<PaymentRow> => ({ ...p, slipUrl: await sign(p.slip_path) }))),
    Promise.all(certificates.map(async (c): Promise<CertRow> => ({ ...c, fileUrl: await sign(c.file_path) }))),
  ]);
  const paid = paidAmount(payments);
  const { data: adjustments } = await supabase.from("documents").select("id, number, doc_type, status, total").eq("ref_document_id", id);

  // Installments and commission (quotations), and the links between quotation, invoice and receipt.
  const isQuotation = doc.doc_type === "quotation";
  const [plan, linked, commissions, receipts, parent, instInfo] = await Promise.all([
    isQuotation ? supabase.from("installments").select("*").eq("quotation_id", id).order("position") : Promise.resolve({ data: null }),
    isQuotation ? supabase.from("documents").select("id, doc_type, status, number, total, installment_id").eq("quotation_id", id) : Promise.resolve({ data: null }),
    isQuotation ? supabase.from("commissions").select("*").eq("quotation_id", id).order("created_at") : Promise.resolve({ data: null }),
    doc.doc_type === "invoice" ? supabase.from("documents").select("id, number, status").eq("source_document_id", id).neq("status", "void") : Promise.resolve({ data: null }),
    doc.quotation_id || doc.source_document_id
      ? supabase.from("documents").select("id, number, doc_type").in("id", [doc.quotation_id, doc.source_document_id].filter((x): x is string => !!x))
      : Promise.resolve({ data: null }),
    doc.installment_id ? supabase.from("installments").select("position, label, pct_bps, quotation_id").eq("id", doc.installment_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const installmentRows: InstallmentRow[] = (plan.data ?? []).map((p) => {
    const st = installmentStage(p.id, linked.data ?? []);
    return { id: p.id, position: p.position, label: p.label, pctBps: p.pct_bps, amount: p.amount, stage: st.stage, invoice: st.invoice, receipt: st.receipt };
  });
  const planLocked = (linked.data ?? []).some((d) => d.status !== "void");
  const quotationDoc = parent.data?.find((d) => d.id === doc.quotation_id);
  const sourceDoc = parent.data?.find((d) => d.id === doc.source_document_id);
  const receipt = receipts.data?.[0];

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
            receipt={doc.doc_type === "invoice" && (doc.status === "issued" || doc.status === "paid") ? receipt ?? null : undefined}
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
                {quotationDoc && (
                  <><dt className="text-muted-foreground">Quotation</dt><dd><Link href={`/documents/${quotationDoc.id}`} className="text-cobalt underline">{quotationDoc.number}</Link>{instInfo.data && ` · installment ${instInfo.data.position} · ${instInfo.data.label}`}</dd></>
                )}
                {sourceDoc && (<><dt className="text-muted-foreground">Settles invoice</dt><dd><Link href={`/documents/${sourceDoc.id}`} className="text-cobalt underline">{sourceDoc.number}</Link></dd></>)}
                {receipt && (<><dt className="text-muted-foreground">Receipt / tax invoice</dt><dd><Link href={`/documents/${receipt.id}`} className="text-cobalt underline">{receipt.number ?? "Draft"}</Link></dd></>)}
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

          {isQuotation && doc.status !== "draft" && doc.status !== "void" && (
            <InstallmentsPanel quotationId={id} taxable={doc.taxable} rows={installmentRows} locked={planLocked} />
          )}
          {isQuotation && doc.status !== "void" && (
            <CommissionPanel quotationId={id} taxable={doc.taxable} rows={commissions.data ?? []} today={today} />
          )}
          {showEtax && (
            <EtaxPanel
              id={id}
              problems={etaxProblems}
              status={doc.etax_status}
              testCert={doc.etax_test_cert}
              generatedAt={doc.etax_generated_at}
              xmlUrl={etaxXmlUrl}
              pdfUrl={etaxPdfUrl}
              error={doc.etax_error}
            />
          )}
          {isPayable(doc.doc_type) && doc.status !== "draft" && doc.status !== "void" && (
            <PaymentsPanel documentId={id} payments={paymentRows} netReceivable={doc.net_receivable} paid={paid} today={today} open={doc.status === "issued"} />
          )}
          {doc.wht > 0 && doc.doc_type !== "quotation" && doc.status !== "draft" && doc.status !== "void" && (
            <WhtPanel documentId={id} certificates={certRows} expectedWht={doc.wht} taxable={doc.taxable} today={today} />
          )}
        </div>

        <aside aria-label="Document" className="xl:sticky xl:top-6 xl:self-start">
          <PreviewFrame width={A4.width} height={A4.height} title={doc.number ?? "Draft preview"}>
            <InvoiceModern doc={view} verifyBaseUrl={process.env.APP_URL} />
          </PreviewFrame>
        </aside>
      </div>
    </>
  );
}
