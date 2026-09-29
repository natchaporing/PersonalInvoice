// Creates a self-signed RSA-2048 signing certificate as a PKCS#12 bundle.
// Usage: npx tsx scripts/generate-signing-cert.ts "Your Business Name" [years]
// Prints SIGNING_P12_BASE64 and SIGNING_P12_PASSPHRASE for your environment (never commit them).
// Replace later with a certificate from a Thai CA (e.g. for e-Tax) using the same two variables.
import { randomBytes } from "node:crypto";
import forge from "node-forge";

const commonName = process.argv[2] ?? "PersonalInvoice";
const years = Number(process.argv[3] ?? 5);

const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = "01" + randomBytes(8).toString("hex");
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date(Date.now() + years * 365 * 24 * 3600 * 1000);
const attrs = [
  { name: "commonName", value: commonName },
  { name: "countryName", value: "TH" },
  { name: "organizationName", value: commonName },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([
  { name: "basicConstraints", cA: false },
  { name: "keyUsage", digitalSignature: true, nonRepudiation: true },
  { name: "extKeyUsage", emailProtection: true },
]);
cert.sign(keys.privateKey, forge.md.sha256.create());

const passphrase = randomBytes(18).toString("base64url");
const p12 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], passphrase, { algorithm: "aes256" });
const der = forge.asn1.toDer(p12).getBytes();

console.log(`SIGNING_P12_BASE64=${Buffer.from(der, "binary").toString("base64")}`);
console.log(`SIGNING_P12_PASSPHRASE=${passphrase}`);
