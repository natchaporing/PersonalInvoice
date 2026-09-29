// PAdES-style signing of a finished PDF with a PKCS#12 certificate.
import { createHash } from "node:crypto";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import signpdf from "@signpdf/signpdf";
import { P12Signer } from "@signpdf/signer-p12";
import { SUBFILTER_ETSI_CADES_DETACHED } from "@signpdf/utils";
import { PDFDocument } from "pdf-lib";

export interface SigningIdentity {
  p12: Buffer;
  passphrase: string;
}

export function signingIdentityFromEnv(env = process.env): SigningIdentity {
  const b64 = env.SIGNING_P12_BASE64;
  if (!b64) throw new Error("Signing certificate is not configured (SIGNING_P12_BASE64)");
  return { p12: Buffer.from(b64, "base64"), passphrase: env.SIGNING_P12_PASSPHRASE ?? "" };
}

export interface SignDetails {
  name: string;
  reason: string;
  location: string;
  contactInfo: string;
  signingTime?: Date;
}

/** Adds a signature placeholder and signs. The result is tamper-evident in any PDF reader. */
export async function signPdf(pdf: Uint8Array, identity: SigningIdentity, details: SignDetails): Promise<Buffer> {
  const doc = await PDFDocument.load(pdf);
  pdflibAddPlaceholder({
    pdfDoc: doc,
    reason: details.reason,
    contactInfo: details.contactInfo,
    name: details.name,
    location: details.location,
    signingTime: details.signingTime,
    subFilter: SUBFILTER_ETSI_CADES_DETACHED,
    appName: "PersonalInvoice",
  });
  const withPlaceholder = await doc.save({ useObjectStreams: false });
  const signer = new P12Signer(identity.p12, { passphrase: identity.passphrase });
  return signpdf.sign(Buffer.from(withPlaceholder), signer, details.signingTime);
}

export const sha256 = (buf: Uint8Array) => createHash("sha256").update(buf).digest("hex");
