// Builds the e-Tax XML (ETDA standard ขมธอ. 3-2560 version 2.0, UN/CEFACT CrossIndustryInvoice based) for an issued
// document. Pure: same input, same output. The schema and Schematron rules are vendored in vendor/etda-etax and
// checked by xml.test.ts and `npm run etax:validate`.
import { computeTotals, lineAmount, lineNet, roundDiv, type Satang } from "@/lib/thai/money";

export type EtaxDocType = "tax_invoice" | "receipt_tax_invoice" | "credit_note" | "debit_note";
export const ETAX_DOC_TYPES: readonly string[] = ["tax_invoice", "receipt_tax_invoice", "credit_note", "debit_note"];
export const isEtaxDocType = (t: string): t is EtaxDocType => ETAX_DOC_TYPES.includes(t);

/** Structured Thai address with the official codes. */
export interface EtaxSellerAddress {
  postcode: string; // 5 digits
  buildingNumber: string;
  street?: string;
  provinceCode: string; // 2 digits
  districtCode: string; // 4 digits
  subdistrictCode: string; // 6 digits
}

export interface EtaxInput {
  docType: EtaxDocType;
  number: string;
  /** YYYY-MM-DD */
  issueDate: string;
  /** Local (Bangkok) time the record was created, "YYYY-MM-DDTHH:mm:ss". */
  createdAt: string;
  dueDate?: string;
  seller: { nameTh: string; taxId: string; branchCode: string; email?: string; address: EtaxSellerAddress };
  buyer: {
    nameTh: string;
    taxId: string;
    branchCode: string;
    isJuristic: boolean;
    email?: string;
    /** Free-text address and its postcode. The standard allows an unstructured buyer address. */
    addressText: string;
    postcode: string;
  };
  lines: { code?: string; nameTh: string; qtyMilli: number; unitPrice: Satang; discount: Satang; vatBps: number }[];
  /** Discount on the whole document. */
  discount: Satang;
  vatBps: number;
  pricesIncludeVat: boolean;
  notes?: string;
  /** Required for credit and debit notes. */
  adjustment?: {
    reason: string;
    original: { number: string; issueDate: string; docType: "tax_invoice" | "receipt_tax_invoice" | "credit_note" | "debit_note"; taxable: Satang };
  };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (satang: Satang) => (satang / 100).toFixed(2);
const rate = (bps: number) => (bps / 100).toFixed(2).replace(/\.?0+$/, "") || "0";
const dt = (isoDate: string) => `${isoDate}T00:00:00.0`;
const dtLocal = (local: string) => `${local.slice(0, 19)}.0`;

/** Document name and type code for each supported document. */
const DOC: Record<EtaxDocType, { code: string; name: string; root: "TaxInvoice" | "DebitCreditNote" }> = {
  tax_invoice: { code: "388", name: "ใบกำกับภาษี", root: "TaxInvoice" },
  receipt_tax_invoice: { code: "T03", name: "ใบเสร็จรับเงิน/ใบกำกับภาษี", root: "TaxInvoice" },
  credit_note: { code: "81", name: "ใบลดหนี้", root: "DebitCreditNote" },
  debit_note: { code: "80", name: "ใบเพิ่มหนี้", root: "DebitCreditNote" },
};

/** Reference type code of the document a note adjusts. */
const REF_CODE: Record<string, string> = { tax_invoice: "388", receipt_tax_invoice: "T03", credit_note: "81", debit_note: "80" };

const tag = (name: string, value: string | number, attrs = "") => `<ram:${name}${attrs}>${esc(String(value))}</ram:${name}>`;

function party(kind: "SellerTradeParty" | "BuyerTradeParty", p: { nameTh: string; taxId: string; branchCode: string; schemeID: "TXID" | "NIDN"; email?: string }, address: string) {
  const id = p.schemeID === "TXID" ? `${p.taxId}${p.branchCode.padStart(5, "0")}` : p.taxId;
  return [
    `<ram:${kind}>`,
    tag("Name", p.nameTh),
    `<ram:SpecifiedTaxRegistration>${tag("ID", id, ` schemeID="${p.schemeID}"`)}</ram:SpecifiedTaxRegistration>`,
    p.email ? `<ram:DefinedTradeContact><ram:EmailURIUniversalCommunication>${tag("URIID", `mailto:${p.email}`)}</ram:EmailURIUniversalCommunication></ram:DefinedTradeContact>` : "",
    address,
    `</ram:${kind}>`,
  ].join("");
}

/** Per-line VAT split: the line amount is either ex-VAT already or includes VAT. */
function lineVat(amount: Satang, bps: number, pricesIncludeVat: boolean) {
  if (bps === 0) return { basis: amount, vat: 0 };
  if (pricesIncludeVat) {
    const basis = roundDiv(amount * 10000, 10000 + bps);
    return { basis, vat: amount - basis };
  }
  return { basis: amount, vat: roundDiv(amount * bps, 10000) };
}

export function buildEtaxXml(input: EtaxInput): string {
  const meta = DOC[input.docType];
  const isNote = meta.root === "DebitCreditNote";
  if (isNote && !input.adjustment) throw new Error("credit and debit notes need the original document and a reason");

  const totals = computeTotals({
    lines: input.lines.map((l) => ({ qtyMilli: l.qtyMilli, unitPrice: l.unitPrice, discount: l.discount, vatBps: l.vatBps })),
    discount: input.discount,
    vatRegistered: true,
    vatBps: input.vatBps,
    pricesIncludeVat: input.pricesIncludeVat,
  });

  const ns = {
    ram: `urn:etda:uncefact:data:standard:${meta.root}_ReusableAggregateBusinessInformationEntity:2`,
    rsm: `urn:etda:uncefact:data:standard:${meta.root}_CrossIndustryInvoice:2`,
  };
  const root = `${meta.root}_CrossIndustryInvoice`;

  const a = input.seller.address;
  const sellerAddress = [
    "<ram:PostalTradeAddress>",
    tag("PostcodeCode", a.postcode),
    a.street ? tag("StreetName", a.street) : "",
    tag("CityName", a.districtCode),
    tag("CitySubDivisionName", a.subdistrictCode),
    tag("CountryID", "TH", ' schemeID="3166-1 alpha-2"'),
    tag("CountrySubDivisionID", a.provinceCode),
    tag("BuildingNumber", a.buildingNumber),
    "</ram:PostalTradeAddress>",
  ].join("");
  const buyerAddress = ["<ram:PostalTradeAddress>", tag("PostcodeCode", input.buyer.postcode), tag("LineOne", input.buyer.addressText), tag("CountryID", "TH", ' schemeID="3166-1 alpha-2"'), "</ram:PostalTradeAddress>"].join("");

  // Header
  const document = [
    "<rsm:ExchangedDocument>",
    tag("ID", input.number),
    tag("Name", meta.name),
    tag("TypeCode", meta.code),
    tag("IssueDateTime", dt(input.issueDate)),
    isNote ? tag("Purpose", input.adjustment!.reason) : "",
    isNote ? tag("PurposeCode", input.docType === "credit_note" ? "CDNS99" : "DBNS99") : "",
    tag("CreationDateTime", dtLocal(input.createdAt)),
    input.notes ? `<ram:IncludedNote>${tag("Subject", "หมายเหตุ")}${tag("Content", input.notes.slice(0, 500))}</ram:IncludedNote>` : "",
    "</rsm:ExchangedDocument>",
  ].join("");

  const agreement = [
    "<ram:ApplicableHeaderTradeAgreement>",
    party("SellerTradeParty", { nameTh: input.seller.nameTh, taxId: input.seller.taxId, branchCode: input.seller.branchCode, schemeID: "TXID", email: input.seller.email }, sellerAddress),
    party(
      "BuyerTradeParty",
      { nameTh: input.buyer.nameTh, taxId: input.buyer.taxId, branchCode: input.buyer.branchCode, schemeID: input.buyer.isJuristic ? "TXID" : "NIDN", email: input.buyer.email },
      buyerAddress,
    ),
    isNote
      ? `<ram:AdditionalReferencedDocument>${tag("IssuerAssignedID", input.adjustment!.original.number)}${tag("IssueDateTime", dt(input.adjustment!.original.issueDate))}${tag("ReferenceTypeCode", REF_CODE[input.adjustment!.original.docType])}</ram:AdditionalReferencedDocument>`
      : "",
    "</ram:ApplicableHeaderTradeAgreement>",
  ].join("");

  // The schema requires a delivery section; the supply is dated by the document date.
  const delivery = `<ram:ApplicableHeaderTradeDelivery><ram:ActualDeliverySupplyChainEvent>${tag("OccurrenceDateTime", dt(input.issueDate))}</ram:ActualDeliverySupplyChainEvent></ram:ApplicableHeaderTradeDelivery>`;

  // Settlement: VAT per rate, document discount, totals
  const taxes = totals.vatGroups
    .map((g) => `<ram:ApplicableTradeTax>${tag("TypeCode", "VAT")}${tag("CalculatedRate", rate(g.bps))}${tag("BasisAmount", money(g.taxable))}${tag("CalculatedAmount", money(g.vat))}</ram:ApplicableTradeTax>`)
    .join("");
  const docAllowance =
    totals.discount > 0
      ? `<ram:SpecifiedTradeAllowanceCharge>${tag("ChargeIndicator", "false")}${tag("ActualAmount", money(totals.discount))}${tag("ReasonCode", "95")}${tag("Reason", "ส่วนลด")}</ram:SpecifiedTradeAllowanceCharge>`
      : "";
  const summation = isNote
    ? [
        "<ram:SpecifiedTradeSettlementHeaderMonetarySummation>",
        tag("OriginalInformationAmount", money(input.adjustment!.original.taxable)),
        tag("LineTotalAmount", money(input.docType === "credit_note" ? input.adjustment!.original.taxable - totals.taxable : input.adjustment!.original.taxable + totals.taxable)),
        tag("DifferenceInformationAmount", money(totals.taxable)),
        tag("AllowanceTotalAmount", money(totals.discount + totals.lineDiscount)),
        tag("TaxBasisTotalAmount", money(totals.taxable)),
        tag("TaxTotalAmount", money(totals.vat)),
        tag("GrandTotalAmount", money(totals.total)),
        "</ram:SpecifiedTradeSettlementHeaderMonetarySummation>",
      ].join("")
    : [
        "<ram:SpecifiedTradeSettlementHeaderMonetarySummation>",
        tag("LineTotalAmount", money(totals.subtotal)),
        tag("AllowanceTotalAmount", money(totals.discount)),
        tag("TaxBasisTotalAmount", money(totals.taxable)),
        tag("TaxTotalAmount", money(totals.vat)),
        tag("GrandTotalAmount", money(totals.total)),
        "</ram:SpecifiedTradeSettlementHeaderMonetarySummation>",
      ].join("");
  const settlement = ["<ram:ApplicableHeaderTradeSettlement>", tag("InvoiceCurrencyCode", "THB", ' listID="ISO 4217 3A"'), taxes, docAllowance, summation, "</ram:ApplicableHeaderTradeSettlement>"].join("");

  const items = input.lines
    .map((l, i) => {
      const gross = lineAmount(l);
      const net = lineNet(l);
      const { basis, vat } = lineVat(net, l.vatBps, input.pricesIncludeVat);
      return [
        "<ram:IncludedSupplyChainTradeLineItem>",
        `<ram:AssociatedDocumentLineDocument>${tag("LineID", i + 1)}</ram:AssociatedDocumentLineDocument>`,
        `<ram:SpecifiedTradeProduct>${l.code ? tag("ID", l.code) : ""}${tag("Name", l.nameTh)}</ram:SpecifiedTradeProduct>`,
        `<ram:SpecifiedLineTradeAgreement><ram:GrossPriceProductTradePrice>${tag("ChargeAmount", money(l.unitPrice))}</ram:GrossPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>`,
        `<ram:SpecifiedLineTradeDelivery>${tag("BilledQuantity", (l.qtyMilli / 1000).toString())}</ram:SpecifiedLineTradeDelivery>`,
        "<ram:SpecifiedLineTradeSettlement>",
        `<ram:ApplicableTradeTax>${tag("TypeCode", "VAT")}${tag("CalculatedRate", rate(l.vatBps))}${tag("BasisAmount", money(basis))}${tag("CalculatedAmount", money(vat))}</ram:ApplicableTradeTax>`,
        l.discount > 0 ? `<ram:SpecifiedTradeAllowanceCharge>${tag("ChargeIndicator", "false")}${tag("ActualAmount", money(l.discount))}${tag("ReasonCode", "95")}${tag("Reason", "ส่วนลด")}</ram:SpecifiedTradeAllowanceCharge>` : "",
        "<ram:SpecifiedTradeSettlementLineMonetarySummation>",
        tag("TaxTotalAmount", money(vat)),
        tag("NetLineTotalAmount", money(basis), ' currencyID="THB"'),
        tag("NetIncludingTaxesLineTotalAmount", money(basis + vat), ' currencyID="THB"'),
        "</ram:SpecifiedTradeSettlementLineMonetarySummation>",
        "</ram:SpecifiedLineTradeSettlement>",
        "</ram:IncludedSupplyChainTradeLineItem>",
      ].join("");
      void gross;
    })
    .join("");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rsm:${root} xmlns:ram="${ns.ram}" xmlns:rsm="${ns.rsm}">`,
    `<rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter>${tag("ID", "ER3-2560", ' schemeAgencyID="ETDA" schemeVersionID="v2.0"')}</ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>`,
    document,
    `<rsm:SupplyChainTradeTransaction>${agreement}${delivery}${settlement}${items}</rsm:SupplyChainTradeTransaction>`,
    `</rsm:${root}>`,
  ].join("\n");
}
