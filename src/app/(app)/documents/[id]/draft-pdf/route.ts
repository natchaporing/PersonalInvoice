import { getDocumentBundle } from "@/lib/data/documents";
import { renderDocumentPdf } from "@/lib/pdf/generate";
import { createClient } from "@/lib/supabase/server";

/**
 * A draft as a PDF to send the client for checking before it is issued. Not signed and not numbered: the page
 * carries a DRAFT watermark and says it is not a tax document. Made on request, never stored.
 */
export async function GET(_: Request, { params }: RouteContext<"/documents/[id]/draft-pdf">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return new Response("sign in first", { status: 401 });
  const bundle = await getDocumentBundle(supabase, id, data.user.id);
  if (!bundle || bundle.doc.status !== "draft") return new Response("only drafts have a draft PDF", { status: 404 });
  const pdf = await renderDocumentPdf(id);
  const name = `DRAFT-${bundle.doc.doc_type.replaceAll("_", "-")}-${bundle.doc.issue_date}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" },
  });
}
