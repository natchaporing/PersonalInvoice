import Link from "next/link";
import { A4, InvoiceDocument } from "@/components/invoice-document";
import { ScaledPage } from "@/components/scaled-page";
import type { Lang } from "@/lib/document-view";
import { sampleTaxInvoice } from "@/lib/sample-data";
import { PrintButton } from "./print-button";

const LANGS: { key: Lang; label: string }[] = [
  { key: "bilingual", label: "TH + EN" },
  { key: "th", label: "ไทย" },
  { key: "en", label: "English" },
];

export default async function TaxInvoicePreview({ searchParams }: PageProps<"/preview/tax-invoice">) {
  const sp = await searchParams;
  const lang = (LANGS.find((l) => l.key === sp.lang)?.key ?? "bilingual") as Lang;
  const draft = sp.status === "draft";
  const doc = { ...sampleTaxInvoice, lang, status: draft ? ("draft" as const) : ("issued" as const), number: draft ? undefined : sampleTaxInvoice.number };
  const href = (l: Lang, d: boolean) => `/preview/tax-invoice?lang=${l}${d ? "&status=draft" : ""}`;

  return (
    <div className="min-h-screen bg-surface-2 py-6 print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { background: #fff } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[794px] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/documents/new" className="btn">← Editor</Link>
          {LANGS.map((l) => (
            <Link key={l.key} href={href(l.key, draft)} aria-current={l.key === lang ? "true" : undefined} className={`btn ${l.key === lang ? "btn-primary" : ""}`}>{l.label}</Link>
          ))}
          <Link href={href(lang, !draft)} className="btn">{draft ? "Show issued" : "Show draft"}</Link>
        </div>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-[794px] px-4 shadow-none print:max-w-none print:p-0">
        <div className="hidden print:block" style={{ width: A4.width, height: A4.height }}>
          <InvoiceDocument doc={doc} />
        </div>
        <div className="border border-border shadow-lg print:hidden">
          <ScaledPage width={A4.width} height={A4.height}>
            <InvoiceDocument doc={doc} />
          </ScaledPage>
        </div>
      </div>
    </div>
  );
}
