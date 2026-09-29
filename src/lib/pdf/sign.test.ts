import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import forge from "node-forge";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { sha256, signPdf } from "./sign";

function selfSignedP12(passphrase: string): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 60_000);
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  const attrs = [{ name: "commonName", value: "Test Signer" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const asn = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], passphrase, { algorithm: "3des" });
  return Buffer.from(forge.asn1.toDer(asn).getBytes(), "binary");
}

async function samplePdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  page.drawText("Tax invoice TX2026-0001", { x: 50, y: 780, size: 18, font: await doc.embedFont(StandardFonts.Helvetica) });
  return doc.save();
}

const hasOpenssl = (() => {
  try {
    execFileSync("openssl", ["version"]);
    return true;
  } catch {
    return false;
  }
})();

/** Splits a signed PDF into (signed bytes, DER signature) using its /ByteRange. */
function extract(pdf: Buffer) {
  const m = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/.exec(pdf.toString("latin1"));
  if (!m) throw new Error("no ByteRange");
  const [a, b, c, d] = m.slice(1).map(Number);
  const signed = Buffer.concat([pdf.subarray(a, a + b), pdf.subarray(c, c + d)]);
  const hex = pdf.subarray(a + b + 1, c - 1).toString("latin1").replace(/0+$/, "");
  return { range: [a, b, c, d], signed, der: Buffer.from(hex.length % 2 ? hex + "0" : hex, "hex") };
}

describe("signPdf", () => {
  it("produces a PDF whose byte range covers the whole file except the signature", async () => {
    const out = await signPdf(await samplePdf(), { p12: selfSignedP12("pw"), passphrase: "pw" }, {
      name: "Seller", reason: "Issued TX2026-0001", location: "Thailand", contactInfo: "a@b.c",
    });
    const { range } = extract(out);
    expect(range[0]).toBe(0);
    expect(range[2] + range[3]).toBe(out.length);
    expect(out.toString("latin1")).toContain("/ETSI.CAdES.detached");
    expect(sha256(out)).toMatch(/^[0-9a-f]{64}$/);
    await expect(PDFDocument.load(out)).resolves.toBeTruthy();
  });

  it.skipIf(!hasOpenssl)("signature verifies with OpenSSL and fails after tampering", async () => {
    const out = await signPdf(await samplePdf(), { p12: selfSignedP12("pw"), passphrase: "pw" }, {
      name: "Seller", reason: "r", location: "TH", contactInfo: "",
    });
    const dir = mkdtempSync(join(tmpdir(), "sig-"));
    const { signed, der } = extract(out);
    writeFileSync(join(dir, "sig.der"), der);
    writeFileSync(join(dir, "content.bin"), signed);
    const verify = (content: string) =>
      execFileSync("openssl", ["cms", "-verify", "-inform", "DER", "-in", join(dir, "sig.der"), "-content", content, "-binary", "-noverify", "-out", "/dev/null"], { stdio: "pipe" });
    expect(() => verify(join(dir, "content.bin"))).not.toThrow();

    const tampered = Buffer.from(signed);
    tampered[100] ^= 0xff;
    writeFileSync(join(dir, "tampered.bin"), tampered);
    expect(() => verify(join(dir, "tampered.bin"))).toThrow();
  });
});
