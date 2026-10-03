import { notFound } from "next/navigation";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { getSubscriptionReceipt } from "@/lib/billing/receipts";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Print · Tra" };

/** Bare A4 page of a subscription receipt, for server-side PDF rendering. */
export default async function PrintReceipt({ params }: PageProps<"/print/receipts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const receipt = await getSubscriptionReceipt(supabase, id);
  if (!receipt) notFound();
  return (
    <>
      <style>{`@page { size: A4; margin: 0 } html, body { margin: 0; background: #fff }`}</style>
      <div style={{ width: A4.width, height: A4.height }}>
        <InvoiceModern doc={receipt.view} verifyBaseUrl={process.env.APP_URL} />
      </div>
    </>
  );
}
