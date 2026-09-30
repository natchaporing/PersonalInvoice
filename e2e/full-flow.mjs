// End-to-end run of the whole business flow against a running app + Supabase (use supabase/local).
// Usage: BASE_URL=http://localhost:3100 CHROMIUM_PATH=... node e2e/full-flow.mjs [screenshotDir]
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const MAIL = process.env.MAILPIT_URL ?? "http://localhost:8025"; // local Supabase stack catches auth email here
const SHOTS = process.argv[2];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const email = `owner-${randomBytes(4).toString("hex")}@example.com`;
const password = "correct-horse-battery";
const log = (...a) => console.log("•", ...a);
const fail = (msg) => { throw new Error(msg); };

/** Waits until `count` emails to `to` exist in Mailpit; returns their confirmation links, newest first. */
async function confirmationLinks(to, count = 1) {
  for (let i = 0; i < 40; i++) {
    const found = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
    if ((found.messages?.length ?? 0) >= count) {
      const links = [];
      for (const m of found.messages) {
        const msg = await (await fetch(`${MAIL}/api/v1/message/${m.ID}`)).json();
        const hit = /https?:\/\/[^\s"'<>]*\/verify\?[^\s"'<>]*/.exec(`${msg.HTML}\n${msg.Text}`);
        if (hit) links.push(hit[0].replace(/&amp;/g, "&"));
      }
      if (links.length >= count) return links;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`expected ${count} confirmation emails for ${to}`);
}
const confirmationLink = async (to, count = 1) => (await confirmationLinks(to, count))[0];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-proxy-server"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => { if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
const shot = async (name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

try {
  // 1. Signed-out visitors are sent to /login
  await page.goto(`${BASE}/documents`);
  if (!page.url().includes("/login")) fail(`expected redirect to /login, got ${page.url()}`);
  await shot("01-login");

  // 2. Register: retype-email guard, confirmation email, sign-in blocked until confirmed
  await page.getByRole("button", { name: /create the owner account/i }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Confirm email").fill(email.replace("owner-", "ownr-"));
  await page.getByText("The two email addresses don't match").waitFor();
  if (!(await page.getByRole("button", { name: "Create account" }).isDisabled())) fail("submit should be disabled while emails differ");
  await page.getByLabel("Confirm email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText(`We sent a confirmation link to ${email}`).waitFor();
  if (!page.url().includes("/login")) fail("should stay on /login until confirmed");
  await shot("01b-check-your-email");

  // Sign in before confirming is refused with a resend option
  await page.getByRole("button", { name: /already have an account/i }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByText(/confirm your email first/i).waitFor();

  // Resend delivers a second email; either link confirms the account
  await new Promise((r) => setTimeout(r, 2500)); // local throttle is 2s (hosted: 60s)
  await page.getByRole("button", { name: /send the confirmation email again/i }).click();
  await page.getByText(/sent again to/i).waitFor();
  // The resent email finishes with tokens in the URL fragment: the login page signs the user in from it
  const [resentLink, firstLink] = await confirmationLinks(email, 2);
  await page.goto(resentLink);
  await page.waitForURL(/\/settings\?confirmed=1/);
  await page.getByText("Email confirmed. Welcome!").waitFor();
  log("registered, confirmed by the resent email link", email);

  // The original link (PKCE, already used or superseded) in a fresh browser: clear message, no crash
  const stale = await browser.newContext();
  const sp = await stale.newPage();
  await sp.goto(firstLink);
  await sp.waitForURL(/\/login|\/settings/);
  if (sp.url().includes("/login")) {
    await sp.getByText(/confirmation link is invalid or has expired|Sign in/).first().waitFor();
    log("used link lands on /login with a clear message");
  } else {
    log("original link also signs in (unused PKCE code)");
  }
  await stale.close();

  // 3. Business profile with bank account
  const fill = async (label, value) => page.getByLabel(label, { exact: true }).fill(value);
  await fill("Name (Thai)", "สตูดิโอ ณัฐชา");
  await fill("Name (English)", "Natcha Studio");
  await fill("Tax ID", "1-1017-00123-45-6");
  await fill("Address (Thai)", "88 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310");
  await fill("Address (English)", "88 Rama 9 Rd., Huai Khwang, Bangkok 10310");
  await fill("Email", "billing@natcha.example");
  // Bank list: search filters by Thai / English / short name; picking fills both name fields
  const bankSearch = page.getByRole("combobox", { name: "Search bank" });
  await bankSearch.fill("zzzz");
  await page.getByText("No bank matches").waitFor();
  await bankSearch.fill("scb");
  await page.getByRole("option", { name: /Siam Commercial Bank/ }).waitFor();
  const scbFirst = (await page.getByRole("listbox").getByRole("option").first().textContent()) ?? "";
  if (!/Siam Commercial/.test(scbFirst)) fail("SCB should rank first for 'scb'");
  await bankSearch.fill("กสิกร");
  await page.getByRole("option", { name: /Siam Commercial Bank/ }).waitFor({ state: "detached" });
  if ((await page.getByRole("listbox").getByRole("option").count()) !== 1) fail("expected exactly one match for กสิกร: " + JSON.stringify(await page.getByRole("listbox").getByRole("option").allTextContents()));
  await bankSearch.press("ArrowDown").catch(() => {});
  await page.getByRole("option", { name: /Kasikornbank/ }).click();
  if ((await page.getByLabel("Bank (Thai)").inputValue()) !== "ธนาคารกสิกรไทย") fail("Thai bank name not filled");
  if ((await page.getByLabel("Bank (English)").inputValue()) !== "Kasikornbank") fail("English bank name not filled");
  log("bank list: search + select fill the bank fields");
  await fill("Account name (Thai)", "ณัฐชา สตูดิโอ");
  await fill("Account name (English)", "Natcha Studio");
  await fill("Account number", "123-4-56789-0");
  await page.getByLabel("Account type").selectOption("savings");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.getByText("Business profile saved.").waitFor();
  await shot("02-settings");
  log("profile saved");

  // 4. Validation: bad tax ID on a customer is rejected
  await page.goto(`${BASE}/customers/new`);
  await fill("Name (Thai)", "บริษัท สยามดิจิทัล จำกัด");
  await fill("Tax ID", "12345");
  await page.getByRole("button", { name: "Add customer" }).click();
  await page.getByText("Tax ID must be 13 digits").waitFor();
  log("customer validation works");

  // 5. Customer
  await fill("Name (English)", "Siam Digital Co., Ltd.");
  await fill("Tax ID", "0105561000001");
  await fill("Address (Thai)", "99/9 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110");
  await fill("Address (English)", "99/9 Sukhumvit Rd., Khlong Toei, Bangkok 10110");
  await page.getByRole("button", { name: "Add customer" }).click();
  await page.waitForURL(/\/customers$/);
  await page.getByRole("link", { name: "บริษัท สยามดิจิทัล จำกัด" }).waitFor();
  log("customer added");

  // 6. Item
  await page.goto(`${BASE}/items/new`);
  await fill("Name (Thai)", "พัฒนาเว็บไซต์");
  await fill("Name (English)", "Website development");
  await fill("Unit price (THB)", "40,000");
  await fill("Unit", "งาน");
  await page.getByLabel("Customer usually withholds").selectOption("300");
  await page.getByRole("button", { name: "Add item" }).click();
  await page.waitForURL(/\/items$/);
  log("item added");

  // 7. Tax invoice draft: saved item + a manual line, 3% WHT
  await page.goto(`${BASE}/documents/new`);
  await page.getByLabel("Customer", { exact: true }).selectOption({ label: "บริษัท สยามดิจิทัล จำกัด" });
  await page.getByLabel("Add a saved item").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Add line" }).click();
  await page.getByLabel("Description (Thai) · 2").fill("ออกแบบ UI/UX");
  const qtys = page.getByLabel("Qty");
  await qtys.nth(1).fill("20");
  await page.getByLabel("Unit price (THB)").nth(1).fill("500");
  await page.getByLabel("Customer withholds").selectOption("300");
  await shot("03-editor");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await page.waitForURL(/\/documents\/[0-9a-f-]{36}$/);
  const docUrl = page.url();
  const docId = docUrl.split("/").pop();
  log("draft saved", docId);

  // 8. Totals were computed server-side: 50,000 + 7% VAT = 53,500; WHT 3% = 1,500; net 52,000
  for (const t of ["53,500.00", "52,000.00", "1,500.00"]) await page.getByText(t, { exact: false }).first().waitFor();

  // 8b. Light palettes: switch to Jade; it applies instantly, persists across reload, and colours the document
  await page.getByRole("button", { name: /Palette/ }).click();
  await page.getByRole("option", { name: /Jade/ }).click();
  const readPalette = () => page.evaluate(() => ({ attr: document.documentElement.dataset.palette, brand: getComputedStyle(document.documentElement).getPropertyValue("--cobalt").trim(), scheme: getComputedStyle(document.documentElement).colorScheme }));
  let pal = await readPalette();
  if (pal.attr !== "jade" || pal.brand !== "#066044") fail(`palette not applied: ${JSON.stringify(pal)}`);
  await shot("03b-jade");
  await page.reload();
  pal = await readPalette();
  if (pal.attr !== "jade") fail("palette should persist after reload");
  log("palette switched to jade and persisted");

  // 9. Issue & sign
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Issue & sign/ }).click();
  await page.getByText(/Issued and signed\.|Issued\. The signed PDF/).waitFor({ timeout: 60_000 });
  const issuedMsg = await page.getByRole("status").first().textContent();
  if (!/Issued and signed/.test(issuedMsg ?? "")) fail(`signing failed: ${issuedMsg}`);
  await page.reload();
  const number = (await page.locator("h1").textContent())?.trim();
  if (!/^TX\d{4}-0001$/.test(number ?? "")) fail(`unexpected number ${number}`);
  await shot("04-issued");
  log("issued", number);

  // 10. Download the signed PDF and compare its hash with the recorded one
  const recorded = (await page.locator("dt:has-text('PDF SHA-256') + dd").textContent())?.trim();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Signed PDF" }).click()]);
  const pdfPath = await download.path();
  const { readFileSync } = await import("node:fs");
  const pdf = readFileSync(pdfPath);
  if (!pdf.subarray(0, 5).toString().startsWith("%PDF")) fail("download is not a PDF");
  if (!pdf.toString("latin1").includes("/ByteRange")) fail("PDF is not signed");
  const actual = createHash("sha256").update(pdf).digest("hex");
  if (actual !== recorded) fail(`hash mismatch ${actual} vs ${recorded}`);
  if (SHOTS) writeFileSync(`${SHOTS}/${number}.pdf`, pdf);
  log("signed PDF hash matches", actual.slice(0, 16));

  // 11. Issued documents cannot be edited
  await page.goto(`${docUrl}/edit`);
  if (page.url() !== docUrl) fail("edit page should redirect issued documents");

  // 12. Public verification page (signed-out browser) + local hash check
  const verifyHref = await page.getByRole("link", { name: /\/verify\// }).getAttribute("href");
  const anon = await browser.newContext();
  const vp = await anon.newPage();
  await vp.goto(`${BASE}${verifyHref}`);
  await vp.getByText(number).first().waitFor();
  await vp.getByLabel(/Check a PDF you received/).setInputFiles(pdfPath);
  await vp.getByText("Identical to the original issued document").waitFor();
  const tamperedPath = `${pdfPath}.tampered.pdf`;
  const t = Buffer.from(pdf); t[200] ^= 1; writeFileSync(tamperedPath, t);
  await vp.getByLabel(/Check a PDF you received/).setInputFiles(tamperedPath);
  await vp.getByText("differs from the original").waitFor();
  if (SHOTS) await vp.screenshot({ path: `${SHOTS}/05-verify.png`, fullPage: true });
  await vp.goto(`${BASE}/verify/doesnotexist0000`);
  await vp.getByText("Document not found").waitFor();
  await anon.close();
  log("verification page works (match, tamper, unknown)");

  // 13. Record partial then full payment → paid
  await page.goto(docUrl);
  await page.getByLabel("Amount (THB)", { exact: true }).fill("20,000");
  await page.getByLabel("Reference").fill("KBANK-001");
  await page.getByRole("button", { name: "Record payment" }).click();
  await page.getByText("Payment recorded.").waitFor();
  await page.reload();
  await page.getByText("balance ฿32,000.00").waitFor();
  await page.getByRole("button", { name: "Record payment" }).click(); // default amount = balance
  await page.getByText("The document is now paid").waitFor();
  await page.reload();
  await page.locator("[data-slot=badge]", { hasText: /^paid$/ }).first().waitFor();
  log("payments recorded, document paid");

  // 14. 50 Tawi certificate
  await page.getByLabel("Certificate no.").fill("WHT-2569-015");
  await page.getByRole("button", { name: "Save certificate" }).click();
  await page.getByText("Withholding certificate saved.").waitFor();
  await shot("06-paid");
  log("withholding certificate saved");

  // 15. Credit note against the tax invoice
  await page.getByRole("link", { name: "Credit note" }).click();
  await page.waitForURL(/type=credit_note/);
  await page.getByLabel("Reason").fill("ส่วนลดหลังการขาย / Post-sale discount");
  await page.getByLabel("Description (Thai)").first().fill("ส่วนลดค่าพัฒนาเว็บไซต์");
  await page.getByLabel("Unit price (THB)").first().fill("5000");
  for (let i = (await page.getByRole("button", { name: /Remove line/ }).count()) - 1; i >= 1; i--) {
    await page.getByRole("button", { name: `Remove line ${i + 1}` }).click();
  }
  await page.getByLabel("Customer withholds").selectOption("0");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await page.waitForURL(/\/documents\/[0-9a-f-]{36}$/);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Issue & sign/ }).click();
  await page.getByText(/Issued and signed/).waitFor({ timeout: 60_000 });
  await page.reload();
  const cn = (await page.locator("h1").textContent())?.trim();
  if (!/^CN\d{4}-0001$/.test(cn ?? "")) fail(`unexpected credit note number ${cn}`);
  await shot("07-credit-note");
  log("credit note issued", cn);

  // 16. Tax page: 50,000 − 5,000 = 45,000 sales; VAT 3,500 − 350 = 3,150
  await page.goto(`${BASE}/tax`);
  await page.getByText("฿45,000.00").first().waitFor();
  await page.getByText("฿3,150.00").first().waitFor();
  const csvResp = await page.request.get(`${BASE}/tax/export`);
  const csv = await csvResp.text();
  if (!csv.startsWith("﻿") || !csv.includes(number) || !csv.includes(cn) || !csv.includes("-5000.00")) fail("CSV content unexpected");
  await shot("08-tax");
  log("tax report + CSV correct");

  // 17. Dashboard reflects paid invoice (nothing outstanding) and month revenue
  await page.goto(`${BASE}/`);
  await page.getByText("Nothing outstanding.").waitFor();
  await page.getByText("฿45,000.00").first().waitFor();
  await shot("09-dashboard");
  log("dashboard figures correct");

  // 18. Draft void rules: voiding is blocked for documents with payments (button hidden)
  await page.goto(docUrl);
  if (await page.getByRole("button", { name: "Void" }).count()) fail("void should be hidden when payments exist");

  // 19. Row-level security: a second user cannot see the first user's document or PDF
  const other = await browser.newContext();
  const op = await other.newPage();
  await op.goto(`${BASE}/login`);
  await op.getByRole("button", { name: /create the owner account/i }).click();
  const otherEmail = `other-${randomBytes(4).toString("hex")}@example.com`;
  await op.getByLabel("Email", { exact: true }).fill(otherEmail);
  await op.getByLabel("Confirm email").fill(otherEmail);
  await op.getByLabel("Password").fill(password);
  await op.getByRole("button", { name: "Create account" }).click();
  await op.getByText(/We sent a confirmation link/).waitFor();
  await op.goto(await confirmationLink(otherEmail));
  await op.waitForURL(/\/settings/);
  const resp = await op.goto(docUrl);
  if (resp?.status() !== 404) fail(`other user got ${resp?.status()} for someone else's document`);
  await op.goto(`${BASE}/documents`);
  await op.getByText("No documents yet").waitFor();
  await other.close();
  log("RLS isolates users");

  // 20. Sign out
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login/);
  log("signed out");

  if (errors.length) fail(`page errors:\n${errors.join("\n")}`);
  console.log("\nE2E PASSED");
} catch (e) {
  await shot("zz-failure");
  console.error("\nE2E FAILED:", e.message, "\nat", page.url());
  if (errors.length) console.error(errors.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
}
