import { getSubscriptionReceipt } from "@/lib/billing/receipts";
import { renderPrintPdf } from "@/lib/pdf/generate";
import { signingIdentityFromEnv, signPdf } from "@/lib/pdf/sign";
import { createClient } from "@/lib/supabase/server";

/** The receipt/tax invoice as a signed PDF, rendered on request from the subscriber's own session. */
export async function GET(_: Request, { params }: RouteContext<"/settings/billing/receipts/[id]/pdf">) {
  const { id } = await params;
  const supabase = await createClient();
  const receipt = await getSubscriptionReceipt(supabase, id);
  if (!receipt?.doc.number) return new Response("not found", { status: 404 });
  const seller = receipt.view.seller;
  const pdf = await renderPrintPdf(`/print/receipts/${id}`);
  const signed = await signPdf(pdf, signingIdentityFromEnv(), {
    name: seller.nameEn || "Tra",
    reason: `Issued ${receipt.doc.number}`,
    location: "Thailand",
    contactInfo: seller.email ?? "",
  });
  return new Response(new Uint8Array(signed), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receipt.doc.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
