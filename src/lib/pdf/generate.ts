import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { chromium } from "playwright-core";
import type { Database } from "@/lib/supabase/database.types";
import { sha256, signingIdentityFromEnv, signPdf } from "./sign";

/** Where headless Chromium can reach this same app (it renders /print/documents/:id). */
const internalBaseUrl = () => process.env.INTERNAL_APP_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;

/** Render the print view of a document to PDF, using the caller's session so RLS still applies. */
export async function renderDocumentPdf(documentId: string): Promise<Buffer> {
  const base = internalBaseUrl();
  const jar = (await cookies()).getAll();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--no-sandbox", "--no-proxy-server", "--font-render-hinting=none"],
  });
  try {
    const context = await browser.newContext();
    await context.addCookies(jar.map((c) => ({ name: c.name, value: c.value, url: base })));
    const page = await context.newPage();
    const res = await page.goto(`${base}/print/documents/${documentId}`, { waitUntil: "networkidle", timeout: 30_000 });
    if (!res || !res.ok()) throw new Error(`print view returned ${res?.status() ?? "no response"}`);
    if (!page.url().includes(`/print/documents/${documentId}`)) throw new Error("print view redirected (session not accepted)");
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}

/** Render, sign, store and record the signed PDF of an issued document. */
export async function generateSignedPdf(
  supabase: SupabaseClient<Database>,
  documentId: string,
  ownerId: string,
): Promise<{ path: string; sha256: string }> {
  const { data: doc } = await supabase.from("documents").select("number, status, seller_snapshot, signers_snapshot").eq("id", documentId).maybeSingle();
  if (!doc || !doc.number || doc.status === "draft") throw new Error("only issued documents get a signed PDF");

  const identity = signingIdentityFromEnv();
  const seller = (doc.seller_snapshot ?? {}) as { name_th?: string; name_en?: string; email?: string };
  const people = (doc.signers_snapshot ?? {}) as { signer?: { name_th?: string; name_en?: string } | null; approver?: { name_th?: string; name_en?: string } | null };
  // The PDF signature dictionary holds plain 8-bit text, so use the English name when the Thai one would be garbled.
  const latin = (p?: { name_th?: string; name_en?: string } | null) => (p?.name_en || (p?.name_th && /^[\x20-\xFF]+$/.test(p.name_th) ? p.name_th : undefined)) ?? undefined;
  const signerName = latin(people.signer) ?? latin(seller) ?? "Tra";
  const approverName = latin(people.approver);
  const pdf = await renderDocumentPdf(documentId);
  const signed = await signPdf(pdf, identity, {
    name: signerName,
    reason: `Issued ${doc.number}${people.signer ? ` by ${signerName}` : ""}${approverName ? `; approved by ${approverName}` : ""}`,
    location: "Thailand",
    contactInfo: seller.email ?? "",
  });
  const hash = sha256(signed);
  const path = `${ownerId}/documents/${doc.number}.pdf`;
  const up = await supabase.storage.from("documents").upload(path, signed, { contentType: "application/pdf", upsert: true });
  if (up.error) throw new Error(up.error.message);
  const { error } = await supabase
    .from("documents")
    .update({ pdf_path: path, pdf_sha256: hash, signed_at: new Date().toISOString() })
    .eq("id", documentId);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({ owner_id: ownerId, document_id: documentId, action: "signed", detail: { sha256: hash } });
  return { path, sha256: hash };
}
