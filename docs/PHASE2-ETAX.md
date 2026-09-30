# Phase 2 plan: Thailand e-Tax Invoice

Status: **phases 2.0 to 2.3 built and tested (2026-09-30). Sending (2.4) and RD registration (2.5) wait on your domain and CA certificate.**

Items marked **[VERIFY]** come from secondary sources or are unknown. Confirm them with the Revenue
Department (RD), ETDA or an accountant before building on them. Do not treat them as fact.

## Status and what we verified

Built and passing (`npm test`, `npm run etax:validate`, and the end-to-end run with veraPDF):

- **Official schema vendored** in `vendor/etda-etax/` (ETDA ขมธอ. 3-2560 **v2.0**, GitLab commit `abd815a`, last schema
  change 2024-08-02). Six message types exist; we use `TaxInvoice` and `DebitCreditNote`.
- **XML builder** `src/lib/etax/xml.ts`: tax invoice (type `388`), receipt/tax invoice (`T03`), credit note (`81`), debit
  note (`80`). Every fixture validates against the XSD **and** the ETDA Schematron rules
  (`python3 scripts/validate-etax.py file.xml`; needs `lxml`. The `.sch` files say `xslt2` but only use XPath 1.0, so the
  script runs them as `xslt`).
- **PDF/A-3B** `src/lib/etax/pdfa.ts`: Ghostscript converts the Chromium PDF, pdf-lib attaches the XML
  (`AFRelationship: Alternative`). veraPDF 1.28 reports the result as compliant with the PDF/A-3B profile, **also after
  signing**. The banknote art survives.
- **Package generation** `src/lib/etax/generate.ts` + a panel on the document page: builds XML, PDF/A-3, signs, stores both files,
  records status. Signs with `ETAX_SIGNING_P12_BASE64` if set, otherwise with the self-signed test certificate and
  labels the package **test**.
- **Data**: seller address as official codes (province / district / sub-district from the ETDA code lists, a picker
  in Settings), buyer postcode on customers, e-Tax columns on documents (migration `20261003000000_etax.sql`).

Facts read from the schema and its examples (no longer [VERIFY]):

- Seller and buyer tax ID: `TXID` = 13-digit ID + 5-digit branch (18 characters), or `NIDN` = 13-digit national ID.
- **Seller address must be structured** (postcode, house number, district code, sub-district code, province code).
  **Buyer address may be free text** (one line plus postcode), so customers need only a postcode.
- Credit and debit notes need the original document reference and a purpose code. We send `CDNS99` / `DBNS99` (other,
  services) with the reason as the purpose text.
- The `GuidelineSpecifiedDocumentContextParameter` ID is `ER3-2560`, `schemeVersionID` `v2.0`.

Still open [VERIFY]:

- **CA certificate as a file.** Sources name Thai Digital ID Co., Ltd. and Internet Thailand PCL (INET). Ask whether
  they issue a P12/PFX we can run on a server. **This is now the main blocker for going live.**
- **Credit/debit note amounts.** The ETDA sample's totals are internally inconsistent, so we state original amount,
  corrected value, difference, and VAT on the difference, with the grand total being the note's own amount. Confirm
  with ETDA (`eservice@etda.or.th`) or the accountant.
- Whether the ETDA time-stamped reply can be received by email and how, then step 2.4.
- RD registration (form *บ.อ.01*) steps and timing, and whether route A is right for you.
- Whether the RD wants `PaymentTerms`, unit codes or a `PurposeCode` on ordinary tax invoices (the schema does not).

Known limits of what is built: the XML uses today's profile address rather than a copy frozen at issue; per-line VAT
is 7% or 0% only (no separate zero-rated / exempt code); `invoice` and `quotation` are not e-Tax documents.

## 1. Where we are

Phase 1 issues a normal tax invoice that satisfies the Revenue Code s.86/4 content rules: seller and
buyer tax ID and branch, gap-free numbering, VAT shown separately, credit and debit notes, WHT.
Each PDF is signed with a **self-signed** certificate and has a public `/verify/<code>` page.

That is a valid tax invoice on paper or PDF. It is **not** an e-Tax invoice as far as the RD is
concerned. e-Tax is an optional, separate system.

| e-Tax needs | Today |
|---|---|
| PDF/A-3 file with an XML attached | No. Chromium output is plain PDF, no XML |
| Certificate from a recognised Thai CA | No. Self-signed |
| ETDA time stamp (copy the email to ETDA) | No. We do not send email |
| RD registration as an e-Tax issuer | Not done |

## 2. Which route

The RD has two routes (Thai sources call them e-Tax Invoice *by Time Stamp*, formerly *by Email*,
and *Digital Signature via a service provider*).

| | A. by Time Stamp (email) | B. Digital signature via provider |
|---|---|---|
| Who it is for | Small taxpayers, turnover up to THB 30 million | Larger taxpayers, high volume |
| File | PDF/A-3 with XML embedded, or XML | XML sent to the RD through a service provider |
| Proof | ETDA time stamp on the email | Digital signature on the XML |
| Fit for us | **Yes: personal VAT-registered, low volume** | No |

**Decision: build route A.** Route B stays open as a fallback: an authorised service provider could
send on our behalf if A proves too heavy. **[VERIFY]** that the THB 30 million ceiling and the route
names still apply, and which route the accountant recommends.

## 3. What route A requires

Working list from ETDA and secondary sources. **[VERIFY]** each item against the current RD/ETDA text.

1. **Register with the RD as an e-Tax issuer.** The form is reportedly *บ.อ.01*, filed through the RD's
   registration and signature-verification program. A certificate is needed first.
2. **A digital certificate** from a CA under the National Root CA. Sources name two: Thai Digital ID
   Co., Ltd. and Internet Thailand PCL (INET). **[VERIFY]** the current list, price and validity
   period, and whether a *file-based* certificate (P12/PFX) is issued. Many CAs issue on a USB
   token, which cannot run on Railway. This is the biggest open risk (section 8).
3. **Documents as PDF/A-3 with the XML embedded**, per the ETDA standard *ขมธอ. 3-2560*, version 2.0
   named in ETDA materials. **[VERIFY]** whether a newer version applies. The published standard is
   at `standard.etda.or.th`, and ETDA has a reference generator at `github.com/ETDA/e-TaxInvoice-PDFgen`
   whose README warns its output may not match current RD rules.
4. **Sign the PDF** with the CA certificate.
5. **Email the signed PDF/A-3 to the buyer with ETDA's central address on copy**
   (`csemail@etax.teda.th`, from secondary sources **[VERIFY]**). ETDA time-stamps it and sends a
   stamped copy to both parties. That stamped email is the evidence.
6. **Keep the records** for the statutory period. **[VERIFY]** the period for e-documents. Phase 1 assumed 5 years.

## 4. Design

Flow when an issued document is sent as e-Tax:

```
issued document ─► build XML (ETDA schema) ─► render PDF ─► convert to PDF/A-3 + embed XML
      ─► sign with CA certificate ─► email buyer, cc ETDA ─► store stamped reply + status
```

### 4.1 XML builder (`src/lib/etax/xml.ts`)
- Pure function `DocumentView + totals -> XML string`. Unit tested, no I/O.
- Map our fields to the ETDA schema. Available: type, number, issue date, seller and buyer (name, tax
  ID, branch, address), lines (qty, unit, price, discount, VAT rate), totals, reference document and
  reason for credit/debit notes. Not yet available: any ETDA-required field we do not store. Section 7
  lists the gap check.
- Document type codes (tax invoice, receipt/tax invoice, credit note, debit note) come from the
  schema's code list. **[VERIFY]** and pin the exact schema files in the repo.
- Validate against the official XSD in tests. Fail the build if the schema is not available.

### 4.2 PDF/A-3 (`src/lib/etax/pdfa.ts`)
Chromium cannot write PDF/A-3. Plan:
1. Render as today (Playwright).
2. Convert with **Ghostscript** (`-dPDFA=3`) in the Docker image, or embed the XML and PDF/A metadata
   with a PDF library, then re-check.
3. Attach the XML as an embedded file with `AFRelationship` and matching XMP metadata.
4. **Validate with veraPDF** in tests and in CI.

Constraints: all fonts embedded (already true), no transparency issues that break PDF/A-3, and the
guilloche art must survive conversion. The vector `<use>` art may need flattening. **[VERIFY]** with a
real conversion before committing to Ghostscript.

### 4.3 Signing
Extend `src/lib/pdf/sign.ts` to take the CA certificate instead of the self-signed one. Keep the
self-signed path for non-e-Tax documents. Signing happens **after** PDF/A-3 conversion. The signed
file must stay PDF/A-3 conformant. **[VERIFY]** by re-running veraPDF on the signed output.

### 4.4 Email (`src/lib/etax/send.ts`)
- Transactional email provider with SPF and DKIM on **our own domain**. This depends on the domain
  purchase and is the reason to buy the domain first.
- The message needs: the buyer's address, the ETDA address on copy, the signed PDF/A-3 attached.
  Keep the subject and body plain and predictable. **[VERIFY]** any format ETDA requires.
- Store the outbound message id. Receive or record ETDA's stamped copy. **[VERIFY]** how it arrives
  (reply to a mailbox we control?). If we cannot receive mail, ask ETDA about the alternative.
- Sending is an explicit user action ("Send as e-Tax invoice"). Never automatic.

### 4.5 Database (one new migration)
On `documents` (allowed to change after issue, like `pdf_path`; add to the immutability guard's list):
`etax_status` (`none | queued | sent | stamped | failed`), `etax_sent_at`, `etax_message_id`,
`etax_stamped_at`, `etax_pdf_path`, `etax_xml_path`, `etax_error`. Add `buyer_email` to `customers`
and snapshot it at issue. Add an `etax_events` log table with RLS by owner.

Signed e-Tax files go in the private `documents` bucket next to the ordinary PDF.

### 4.6 UI
- Settings: an **e-Tax** section with the checklist (certificate uploaded, RD registration confirmed,
  sending domain verified) and a switch that stays off until all three are ticked.
- Document page: "Send as e-Tax invoice" for issued tax documents, status badge, retry, download of
  the stamped copy.
- Customer form: buyer email, required to send.

## 5. Phases

| Phase | Deliverable | Exit test |
|---|---|---|
| 2.0 Research | **Done** for schema facts; CA and accountant questions still open (section above) | Written answers filed in `docs/` |
| 2.1 XML | **Done.** Builder + XSD and Schematron validation + tests for the four document types | Passing |
| 2.2 PDF/A-3 | **Done.** Conversion + embedding; Ghostscript added to the Docker image | veraPDF passes, art intact |
| 2.3 Signing | **Done** with the test certificate (still compliant); CA certificate slot ready (`ETAX_SIGNING_P12_*`) | Signature valid in Adobe Reader with the CA certificate |
| 2.4 Sending | Email with ETDA on copy, status tracking, stored stamped copy | Real send to ETDA in a test registration |
| 2.5 Registration | Register with the RD, first live document | RD and ETDA accept it |

Phases 2.1 to 2.3 need no certificate or domain and can be built and tested locally. 2.4 needs the
domain and a real certificate. 2.5 needs the RD registration.

## 6. Prerequisites (owner actions)

1. Buy the domain and set up email (SPF, DKIM) for sending.
2. Choose a CA, buy a **file-based** certificate, and confirm it works on a server.
3. Confirm with an accountant that e-Tax is worth doing (see section 9).
4. File the RD registration once the certificate exists.

## 7. Gaps to close in the data model

Check the ETDA schema field by field. Likely gaps, **[VERIFY]**:
- Buyer email and contact.
- Seller and buyer address split into structured fields (sub-district, district, province, postcode).
  We store one free-text address today.
- Payment terms and method codes.
- Tax code per line (standard, zero-rated, exempt). We only store 7% or 0%, and 0% does not
  separate zero-rated from exempt sales.
- Unit codes from the standard code list.

Splitting the address is the largest data change and also improves PP30 and customer records.

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| CA only issues USB-token certificates | Cannot sign on Railway | Ask CAs first (2.0). Fallbacks: a CA that issues P12 files, a remote-signing service, or route B through a provider |
| PDF/A-3 conversion damages the banknote art or fails validation | Documents look worse or are rejected | Prototype in 2.2 before anything else. Simplify the art for e-Tax copies if needed |
| ETDA or RD rules changed since the sources we read | Rework | Phase 2.0 verification; pin the schema and rule versions in the repo |
| Email deliverability | Documents not stamped | Own domain with SPF/DKIM, use a reputable provider, monitor bounces |
| Certificate private key handling | Forged documents if leaked | Store as a Railway secret, rotate on suspicion, never log it. The Phase 1 self-signed key was printed once in a session and should be rotated |
| Legal reading is wrong | Non-compliant documents | Confirm with the RD or an accountant before going live |

## 9. Is it needed at all?

A paper or plain-PDF tax invoice remains valid. e-Tax adds value if customers require it, or you
want the RD's time stamp as proof. It also carries a yearly certificate cost and registration
work. **Ask an accountant before committing to 2.4 and 2.5.** Phases 2.1 to 2.3 are worth doing
regardless: they produce a structured, machine-readable copy of every document.

## 10. Acceptance criteria

- A tax invoice, receipt/tax invoice, credit note and debit note each produce XSD-valid XML.
- Each PDF/A-3 passes veraPDF, keeps the branding, and opens in Adobe Reader with a valid signature.
- The send flow reaches ETDA and a stamped copy is stored against the document.
- Issued documents stay immutable. Only e-Tax status fields change.
- Existing Phase 1 flows and the E2E run still pass unchanged.

## Sources

- [ETDA e-TaxInvoice-PDFgen (reference generator)](https://github.com/ETDA/e-TaxInvoice-PDFgen)
- [ETDA ICT Standard 3-2560 (English)](https://www.etda.or.th/getattachment/43f4a6d7-946e-4fc3-b5d4-e3c64f9d197a/20250515_ETDA-Rec-3-2560_English-V03.pdf.aspx)
- [ETDA PDF/A-3 workshop](https://etax.teda.th/etaxdocuments/ETDA_PDFA3_Workshop.pdf)
- [RD e-Tax portal](https://etax.rd.go.th/) and [RD overview (PDF)](https://etax.rd.go.th/etax_staticpage/app/emag/flipbook/01_Overview.pdf)
- [PEAK: e-Tax Invoice & e-Receipt](https://www.peakaccount.com/blog/tax/value-added-tax/etax-invoice-by-e-receipt)
- [DiTC: how to register](https://ditc.co.th/knowledge/how-to-etax-invoice-ereceipt/)
- [Sovos](https://sovos.com/blog/vat/thailand-e-tax-filing/), [Forvis Mazars](https://www.forvismazars.com/th/en/insights/doing-business-in-thailand/tax/e-tax-filing-and-documentation-in-thailand), [PKF Thailand](https://pkfthailand.asia/understanding-e-tax-invoice-in-thailand/)
