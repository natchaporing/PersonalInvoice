import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sampleAdjustmentInput, sampleEtaxInput } from "./fixtures";
import { buildEtaxXml } from "./xml";

const STD = join(process.cwd(), "vendor/etda-etax/ETDA/data/standard");
const has = (cmd: string, args: string[]) => spawnSync(cmd, args, { stdio: "ignore" }).status === 0;
const hasXmllint = has("xmllint", ["--version"]);
const hasSchematron = has("python3", ["-c", "import lxml.isoschematron"]);

const cases = [
  ["tax invoice", sampleEtaxInput],
  ["receipt / tax invoice", { ...sampleEtaxInput, docType: "receipt_tax_invoice" as const }],
  ["credit note", sampleAdjustmentInput("credit_note")],
  ["debit note", sampleAdjustmentInput("debit_note")],
] as const;

describe("e-Tax XML content", () => {
  const tiv = buildEtaxXml(sampleEtaxInput);

  it("uses the ETDA v2.0 guideline and the right type code and name", () => {
    expect(tiv).toContain('schemeVersionID="v2.0">ER3-2560<');
    expect(tiv).toContain("<ram:TypeCode>388</ram:TypeCode>");
    expect(tiv).toContain("<ram:Name>ใบกำกับภาษี</ram:Name>");
    expect(buildEtaxXml({ ...sampleEtaxInput, docType: "receipt_tax_invoice" })).toContain("<ram:TypeCode>T03</ram:TypeCode>");
    expect(buildEtaxXml(sampleAdjustmentInput("credit_note"))).toContain("<ram:TypeCode>81</ram:TypeCode>");
    expect(buildEtaxXml(sampleAdjustmentInput("debit_note"))).toContain("<ram:TypeCode>80</ram:TypeCode>");
  });

  it("writes tax IDs the way the Schematron expects (13 digits + 5-digit branch for TXID)", () => {
    expect(tiv).toContain('schemeID="TXID">110170012345600000<');
    expect(tiv).toContain('schemeID="TXID">010556100000100000<');
    const individual = buildEtaxXml({ ...sampleEtaxInput, buyer: { ...sampleEtaxInput.buyer, isJuristic: false, taxId: "1104599001271" } });
    expect(individual).toContain('schemeID="NIDN">1104599001271<');
  });

  it("escapes markup in text", () => {
    expect(tiv).toContain("พัฒนาเว็บไซต์ &amp; &lt;ระบบ&gt;");
    expect(tiv).not.toContain("<ระบบ>");
  });

  it("reports VAT per rate and totals that add up", () => {
    // 36,000 and 10,000 at 7% and 1,000 at 0%, less a 1,000 document discount shared across the lines
    const taxes = [...tiv.matchAll(/<ram:BasisAmount>([\d.]+)<\/ram:BasisAmount><ram:CalculatedAmount>([\d.]+)</g)].map((m) => [m[1], m[2]]);
    const header = tiv.slice(tiv.indexOf("<ram:ApplicableHeaderTradeSettlement>"), tiv.indexOf("<ram:SpecifiedTradeSettlementHeaderMonetarySummation>"));
    const groups = [...header.matchAll(/<ram:BasisAmount>([\d.]+)<\/ram:BasisAmount><ram:CalculatedAmount>([\d.]+)</g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(groups.length).toBe(2);
    expect(taxes.length).toBeGreaterThan(2);
    const basis = groups.reduce((s, g) => s + g[0], 0);
    const vat = groups.reduce((s, g) => s + g[1], 0);
    expect(tiv).toContain(`<ram:TaxBasisTotalAmount>${basis.toFixed(2)}<`);
    expect(tiv).toContain(`<ram:TaxTotalAmount>${vat.toFixed(2)}<`);
    expect(tiv).toContain(`<ram:GrandTotalAmount>${(basis + vat).toFixed(2)}<`);
  });

  it("refuses a credit note without its original document", () => {
    expect(() => buildEtaxXml({ ...sampleEtaxInput, docType: "credit_note" })).toThrow(/original/);
  });

  it("references the original document and states the difference for a credit note", () => {
    const cn = buildEtaxXml(sampleAdjustmentInput("credit_note"));
    expect(cn).toContain("<ram:IssuerAssignedID>TX2026-0001</ram:IssuerAssignedID>");
    expect(cn).toContain("<ram:ReferenceTypeCode>388</ram:ReferenceTypeCode>");
    expect(cn).toContain("<ram:OriginalInformationAmount>54000.00<");
    expect(cn).toContain("<ram:DifferenceInformationAmount>5000.00<");
    expect(cn).toContain("<ram:LineTotalAmount>49000.00<"); // corrected value = original − credit
    expect(cn).toContain("<ram:PurposeCode>CDNS99</ram:PurposeCode>");
  });
});

describe("e-Tax XML against the official ETDA schema", () => {
  const dir = mkdtempSync(join(tmpdir(), "etax-"));
  for (const [name, input] of cases) {
    const file = join(dir, `${input.docType}.xml`);
    writeFileSync(file, buildEtaxXml(input));
    const root = input.docType === "credit_note" || input.docType === "debit_note" ? "DebitCreditNote" : "TaxInvoice";

    it.skipIf(!hasXmllint)(`${name} is valid XSD`, () => {
      execFileSync("xmllint", ["--noout", "--schema", join(STD, `${root}_CrossIndustryInvoice_2p0.xsd`), file], { stdio: "pipe" });
    });

    it.skipIf(!hasSchematron)(`${name} passes the ETDA Schematron rules`, () => {
      const out = spawnSync("python3", ["scripts/validate-etax.py", file], { encoding: "utf8" });
      expect(out.stdout + out.stderr).toContain("PASS");
      expect(out.status).toBe(0);
    });
  }
});
