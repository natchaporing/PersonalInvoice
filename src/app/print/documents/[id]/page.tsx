import { notFound } from "next/navigation";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { getDocumentBundle } from "@/lib/data/documents";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Print · Tra" };

/** Bare A4 page used for printing and for server-side PDF rendering. */
export default async function PrintDocument({ params }: PageProps<"/print/documents/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const bundle = await getDocumentBundle(supabase, id, user.id);
  if (!bundle) notFound();
  return (
    <>
      <style>{`@page { size: A4; margin: 0 } html, body { margin: 0; background: #fff }`}</style>
      <div style={{ width: A4.width, height: A4.height }}>
        <InvoiceModern doc={bundle.view} verifyBaseUrl={process.env.APP_URL} />
      </div>
    </>
  );
}
