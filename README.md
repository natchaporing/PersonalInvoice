# Tra (ตรา) · tra.in.th

Invoicing backoffice for a VAT-registered Thai sole proprietor: quotations, invoices, tax invoices
(ใบกำกับภาษี, Revenue Code s.86/4), receipts, credit and debit notes; VAT and withholding tax;
bilingual Thai/English documents; signed PDFs with a public verification page; monthly PP30 figures.

Next.js 16 · Supabase (Postgres, auth, private storage) · shadcn/ui · deployed on Railway.

## What it does

- **Documents**: draft → issued → paid / void. Issuing assigns a gap-free number per type and year,
  freezes seller and buyer snapshots, and makes the document immutable (enforced in Postgres).
  Corrections go through credit or debit notes.
- **Money**: integer satang everywhere. VAT 7% (exclusive or inclusive), withholding tax on the
  pre-VAT amount, all computed on the server. See `src/lib/thai/`.
- **Signed PDFs**: headless Chromium renders `/print/documents/:id`, the PDF is signed (CAdES-detached)
  with a PKCS#12 certificate and stored privately with its SHA-256. `/verify/<code>` shows the
  recorded facts and lets anyone check a PDF they received (hashed in the browser, never uploaded).
- **Payments**: bank-transfer details print on payable documents; record payments (with slips) and
  50 Tawi withholding certificates per document.
- **Quotation fields**: optional *valid until* and *reply by* dates (empty = not printed), per-line discount and VAT rate (7% or 0%/exempt; the document discount is shared across lines and VAT is computed per rate), optional product-code and unit columns.
- **Signatories**: Settings holds people with a name, title and optional signature image. Pick an issuer and an approver per document; they are frozen onto it at issue, printed with the date, and named in the PDF's digital signature (the PDF itself is signed with your certificate).
- **Open online**: issued documents carry a QR code (vector, in the PDF) that opens the public verification page.
- **Bank list**: Settings has a searchable list of Thai banks (Thai/English name, short name or code) that fills the bank name fields; the bank codes beyond BBL/KBANK/KTB/TTB/SCB should be double-checked against the BOT list.
- **Look**: one light theme, Cobalt (banknote blue with amber and gold), used by the app and every document and PDF.
- **Sign-up**: the email must be typed twice and is confirmed through an emailed link (`/auth/callback`); the login page can resend it.
- **e-Tax package** (phase 2): for issued tax invoices, receipts/tax invoices, credit and debit notes, one click builds the ETDA-standard XML and a signed PDF/A-3 that carries it. Signing with a CA-issued certificate, emailing for the ETDA time stamp and RD registration are still to do; see [docs/PHASE2-ETAX.md](docs/PHASE2-ETAX.md). Needs Ghostscript (in the Docker image) and, to validate locally, `xmllint` and `pip install lxml` (`npm run etax:validate -- file.xml`).
- **Tax**: `/tax` shows output VAT for PP30 and the sales tax report, with CSV export.

## Develop

```bash
npm ci
cp .env.example .env.local          # fill in Supabase URL/key, APP_URL and signing certificate
npm run cert:generate -- "Your Business Name"   # prints SIGNING_P12_* for .env.local
npm run dev
```

### Local Supabase (no hosted project needed)

```bash
npm run db:local        # docker compose: Postgres, auth, REST, storage
npm run db:gateway      # serves http://localhost:54321 like hosted Supabase
# apply supabase/migrations/*.sql to the db container, then point .env.local at localhost:54321
```

`supabase/local/.env` (generated, git-ignored) holds the local anon key.

### Tests

```bash
npm test                # unit tests: money, VAT/WHT, baht text, reports, PDF signing
npm run typecheck && npm run lint
npm run build && npx next start -p 3100
BASE_URL=http://localhost:3100 npm run e2e   # full flow against a running app + Supabase
```

## Deploy (Railway)

The `Dockerfile` builds a standalone Next.js server on Playwright's image (it ships the matching
Chromium). Set these on the service:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project (also build-time) |
| `APP_URL` | public origin, printed in each document's verification link |
| `SIGNING_P12_BASE64`, `SIGNING_P12_PASSPHRASE` | document signing certificate |
| `PORT` | `3000` |

In Supabase → Authentication → URL Configuration, set **Site URL** to `APP_URL` and add `<APP_URL>/auth/callback` to the **Redirect URLs**. Keep "Confirm email" enabled under Sign In / Providers → Email.

## Signing certificate

`npm run cert:generate` makes a self-signed certificate: signatures are tamper-evident, but PDF
readers show the signer as "not trusted". To get a trusted signature (and later RD e-Tax Invoice),
buy a certificate from a Thai CA and put it in the same two variables.

## Not built (yet)

Official Revenue Department e-Tax submission (sending, CA certificate, registration) is planned: see [docs/PHASE2-ETAX.md](docs/PHASE2-ETAX.md).

Multi-user/multi-company, recurring invoices, email sending, payment
gateway links, input-VAT tracking, annual PND 90/91 report.
