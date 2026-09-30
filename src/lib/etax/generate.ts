import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDocumentBundle, getProfile } from "@/lib/data/documents";
import { renderDocumentPdf } from "@/lib/pdf/generate";
import { sha256, type SigningIdentity, signingIdentityFromEnv, signPdf } from "@/lib/pdf/sign";
import type { Database } from "@/lib/supabase/database.types";
import { toPdfA3 } from "./pdfa";
import { prepareEtaxInput } from "./prepare";
import { buildEtaxXml } from "./xml";

/**
 * Certificate for e-Tax documents. Use ETAX_SIGNING_P12_BASE64 / ETAX_SIGNING_P12_PASSPHRASE for the certificate
 * issued by a Thai CA. Without it the package is signed with the self-signed certificate and marked as a test.
 */
export function etaxIdentity(env = process.env): { identity: SigningIdentity; testCert: boolean } {
  if (env.ETAX_SIGNING_P12_BASE64) {
    return { identity: { p12: Buffer.from(env.ETAX_SIGNING_P12_BASE64, "base64"), passphrase: env.ETAX_SIGNING_P12_PASSPHRASE ?? "" }, testCert: false };
  }
  return { identity: signingIdentityFromEnv(env), testCert: true };
}

/** Build the e-Tax package for an issued tax document: XML plus a signed PDF/A-3 that carries it. */
export async function generateEtaxPackage(
  supabase: SupabaseClient<Database>,
  documentId: string,
  ownerId: string,
): Promise<{ ok: true; testCert: boolean } | { ok: false; problems: string[] }> {
  const bundle = await getDocumentBundle(supabase, documentId, ownerId);
  if (!bundle) return { ok: false, problems: ["Document not found."] };
  const profile = await getProfile(supabase, ownerId);

  const prepared = prepareEtaxInput({ doc: bundle.doc, lines: bundle.lines, customer: bundle.customer, profile, ref: bundle.ref });
  if ("problems" in prepared) return { ok: false, problems: prepared.problems };
  const input = prepared.input;

  try {
    const xml = buildEtaxXml(input);
    const pdf = await renderDocumentPdf(documentId);
    const pdfa = await toPdfA3(pdf, { name: `${input.number}.xml`, content: xml }, `${input.number}`);
    const { identity, testCert } = etaxIdentity();
    const signed = await signPdf(pdfa, identity, {
      name: input.seller.nameTh.replace(/[^\x20-\xFF]/g, "") || "Issuer",
      reason: `e-Tax invoice ${input.number}`,
      location: "Thailand",
      contactInfo: input.seller.email ?? "",
    });
    const hash = sha256(signed);

    const xmlPath = `${ownerId}/etax/${input.number}.xml`;
    const pdfPath = `${ownerId}/etax/${input.number}-etax.pdf`;
    const up1 = await supabase.storage.from("documents").upload(xmlPath, Buffer.from(xml, "utf8"), { contentType: "text/xml", upsert: true });
    if (up1.error) throw new Error(up1.error.message);
    const up2 = await supabase.storage.from("documents").upload(pdfPath, signed, { contentType: "application/pdf", upsert: true });
    if (up2.error) throw new Error(up2.error.message);

    const { error } = await supabase
      .from("documents")
      .update({ etax_status: "generated", etax_xml_path: xmlPath, etax_pdf_path: pdfPath, etax_pdf_sha256: hash, etax_generated_at: new Date().toISOString(), etax_test_cert: testCert, etax_error: null })
      .eq("id", documentId);
    if (error) throw new Error(error.message);
    await supabase.from("audit_log").insert({ owner_id: ownerId, document_id: documentId, action: "etax_generated", detail: { sha256: hash, testCert } });
    return { ok: true, testCert };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase.from("documents").update({ etax_error: message.slice(0, 500) }).eq("id", documentId);
    return { ok: false, problems: [message] };
  }
}
