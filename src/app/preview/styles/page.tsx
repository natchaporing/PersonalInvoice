import Link from "next/link";
import { A4, InvoiceDocument } from "@/components/invoice-document";
import { InvoiceModern, type ModernVariant } from "@/components/invoice-modern";
import { PreviewFrame } from "@/components/preview-frame";
import type { Lang } from "@/lib/document-view";
import { sampleTaxInvoice } from "@/lib/sample-data";

export const metadata = { title: "Document styles · Tra" };

const STYLES: { key: ModernVariant | "banknote"; name: string; note: string }[] = [
  { key: "clean", name: "A · Clean", note: "White page, thin brand bar, soft meta panel. Quiet and modern." },
  { key: "band", name: "B · Brand band", note: "Solid brand-colour header with the title in white. Strongest identity." },
  { key: "mono", name: "C · Mono", note: "Ink only, like a Swiss invoice. Palette ignored; prints well in black and white." },
  { key: "banknote", name: "Current · Banknote", note: "Today's guilloche layout, for comparison." },
];

/** Side-by-side drafts of new document styles, with the sample tax invoice. */
export default async function StylesPreview({ searchParams }: PageProps<"/preview/styles">) {
  const sp = await searchParams;
  const lang = (["th", "en", "bilingual"].includes(sp.lang as string) ? sp.lang : "bilingual") as Lang;
  const doc = { ...sampleTaxInvoice, lang };
  const verify = "https://trasolutions.co";
  return (
    <div className="min-h-screen bg-secondary px-4 py-8">
      <div className="mx-auto mb-6 flex max-w-[1680px] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-[28px]">Document styles (draft)</h1>
          <p className="text-muted-foreground">Same sample tax invoice in each style. Pick one and it becomes the style for new documents and PDFs.</p>
        </div>
        <div className="inline-flex rounded-md border border-input bg-card p-0.5 text-sm">
          {(["bilingual", "th", "en"] as Lang[]).map((l) => (
            <Link key={l} href={`/preview/styles?lang=${l}`} className={`rounded-sm px-3 py-1.5 ${l === lang ? "bg-cobalt text-white" : "hover:bg-secondary"}`}>
              {l === "bilingual" ? "TH + EN" : l === "th" ? "ไทย" : "English"}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1680px] gap-8 md:grid-cols-2">
        {STYLES.map((s) => (
          <section key={s.key} aria-label={s.name}>
            <h2 className="display text-xl text-cobalt">{s.name}</h2>
            <p className="mb-2 text-sm text-muted-foreground">{s.note}</p>
            <PreviewFrame width={A4.width} height={A4.height} title={s.name}>
              {s.key === "banknote" ? <InvoiceDocument doc={doc} idPrefix="cmp" verifyBaseUrl={verify} /> : <InvoiceModern doc={doc} variant={s.key} verifyBaseUrl={verify} />}
            </PreviewFrame>
          </section>
        ))}
      </div>
    </div>
  );
}
