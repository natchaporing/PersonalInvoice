import "server-only";
import { renderPrintPdf } from "@/lib/pdf/generate";
import { signingIdentityFromEnv, signPdf } from "@/lib/pdf/sign";

/** A contract PDF from one of its print views. A signed contract carries Tra's seal so later changes show. */
export async function contractPdf(printPath: string, c: { number: string; status: string }) {
  const pdf = await renderPrintPdf(printPath);
  const out =
    c.status === "signed"
      ? await signPdf(pdf, signingIdentityFromEnv(), { name: "Tra (trasolutions.co)", reason: `Sealed by Tra. Signed contract ${c.number}`, location: "Thailand", contactInfo: "" })
      : pdf;
  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${c.status === "draft" ? "DRAFT-" : ""}${c.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
