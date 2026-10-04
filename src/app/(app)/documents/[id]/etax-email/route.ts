import { getDocumentBundle } from "@/lib/data/documents";
import { ETAX_EMAIL_MAX_BYTES, isEtaxEmailType } from "@/lib/etax/email";
import { toPdfA3 } from "@/lib/etax/pdfa";
import { renderDocumentPdf } from "@/lib/pdf/generate";
import { signingIdentityFromEnv, signPdf } from "@/lib/pdf/sign";
import { createClient } from "@/lib/supabase/server";

/** The issued tax document as PDF/A-3, ready to attach to an e-Tax Invoice by Email message. Made on request. */
export async function GET(_: Request, { params }: RouteContext<"/documents/[id]/etax-email">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return new Response("sign in first", { status: 401 });
  const bundle = await getDocumentBundle(supabase, id, data.user.id);
  const doc = bundle?.doc;
  if (!doc?.number || !isEtaxEmailType(doc.doc_type) || (doc.status !== "issued" && doc.status !== "paid")) {
    return new Response("only issued tax documents are sent by e-Tax Invoice by Email", { status: 404 });
  }
  const pdfa = await toPdfA3(await renderDocumentPdf(id), null, doc.number);
  const sealed = await signPdf(pdfa, signingIdentityFromEnv(), {
    name: "Tra (trasolutions.co)",
    reason: `Sealed by Tra. ${doc.number}`,
    location: "Thailand",
    contactInfo: "",
  });
  if (sealed.length > ETAX_EMAIL_MAX_BYTES) return new Response("The PDF is larger than the 3 MB e-Tax Invoice by Email limit.", { status: 413 });
  return new Response(new Uint8Array(sealed), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${doc.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
