import { Download } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { PreviewFrame } from "@/components/preview-frame";
import { buttonVariants } from "@/components/ui/button";
import { getSubscriptionReceipt } from "@/lib/billing/receipts";
import { getMessages } from "@/lib/i18n/server";
import { requireUser } from "@/lib/supabase/server";

export async function generateMetadata() {
  return { title: `${(await getMessages()).billing.receipt} · Tra` };
}

/** The subscriber's receipt/tax invoice for a subscription payment. */
export default async function ReceiptPage({ params }: PageProps<"/settings/billing/receipts/[id]">) {
  const { id } = await params;
  const [{ supabase }, m] = await Promise.all([requireUser(), getMessages()]);
  const receipt = await getSubscriptionReceipt(supabase, id);
  if (!receipt) notFound();
  const number = receipt.doc.number ?? "";

  return (
    <div className="grid max-w-4xl gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{m.billing.receiptTitle(number)}</h2>
          <p className="text-sm text-muted-foreground">{m.billing.receiptNote}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/billing" className={buttonVariants({ variant: "ghost" })}>{m.billing.backToBilling}</Link>
          <a href={`/settings/billing/receipts/${id}/pdf`} className={buttonVariants()} download={`${number}.pdf`}>
            <Download aria-hidden /> {m.billing.downloadPdf}
          </a>
        </div>
      </div>
      <PreviewFrame width={A4.width} height={A4.height} title={number}>
        <InvoiceModern doc={receipt.view} verifyBaseUrl={process.env.APP_URL} />
      </PreviewFrame>
    </div>
  );
}
