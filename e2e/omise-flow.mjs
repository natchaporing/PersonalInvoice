// Checkout through Opn Payments against e2e/fake-omise.mjs: PromptPay QR, card with and without 3-D Secure,
// a declined card, and the webhook. Start the fake API and the app first:
//   node e2e/fake-omise.mjs 3200
//   OMISE_API_BASE=http://localhost:3200 OMISE_PUBLIC_KEY=pkey_test_x OMISE_SECRET_KEY=skey_test_x BILLING_PROVIDER_SECRET=<s> npx next start -p 3100
// with the same secret in the database: update private.billing_config set provider_secret = '<s>' (insert the row if needed).
// Usage: BASE_URL=http://localhost:3100 CHROMIUM_PATH=... LOCAL_DB_PASSWORD=... node e2e/omise-flow.mjs [screenshotDir]
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OMISE = process.env.OMISE_API_BASE ?? "http://localhost:3200";
const MAIL = process.env.MAILPIT_URL ?? "http://localhost:8025";
const SHOTS = process.argv[2];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const log = (...a) => console.log("•", ...a);
const fail = (msg) => { throw new Error(msg); };
const psql = (sql) => spawnSync("docker", ["exec", "-e", `PGPASSWORD=${process.env.LOCAL_DB_PASSWORD ?? ""}`, "personalinvoice-local-db-1", "psql", "-h", "127.0.0.1", "-U", "supabase_admin", "-d", "postgres", "-Atc", sql], { encoding: "utf8" }).stdout.trim();

async function confirmationLink(to) {
  for (let i = 0; i < 40; i++) {
    const found = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
    for (const m of found.messages ?? []) {
      const msg = await (await fetch(`${MAIL}/api/v1/message/${m.ID}`)).json();
      const hit = /https?:\/\/[^\s"'<>]*\/verify\?[^\s"'<>]*/.exec(`${msg.HTML}\n${msg.Text}`);
      if (hit) return hit[0].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no confirmation email for ${to}`);
}

// Omise.js stand-in: the card number picks the fake API's outcome.
const FAKE_OMISE_JS = `window.Omise = { setPublicKey() {}, createToken(type, card, done) {
  const n = card.number;
  if (!/^\\d{16}$/.test(n)) return setTimeout(() => done(400, { message: "number is invalid" }));
  const id = n.endsWith("0002") ? "tokn_test_fail" : n.startsWith("4111") ? "tokn_test_3ds" : "tokn_test_ok";
  setTimeout(() => done(200, { id }));
} };`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-proxy-server"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: "lang", value: "en", url: BASE }]);
await ctx.route("https://cdn.omise.co/omise.js", (r) => r.fulfill({ contentType: "text/javascript", body: FAKE_OMISE_JS }));
const page = await ctx.newPage();
const shot = async (name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
const charges = () => psql(`select string_agg(status || ':' || provider || ':' || coalesce(left(provider_ref, 10), '-'), ',' order by created_at) from billing_charges where owner_id = (select id from auth.users where email = '${email}')`);

const email = `payer-${randomBytes(4).toString("hex")}@example.com`;
try {
  await page.goto(`${BASE}/register`);
  await page.getByLabel("Your name").fill("ณัฐชา ผู้ชำระ");
  await page.getByLabel("Personal tax ID").fill("1234567890121");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Confirm email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByLabel(/I agree to the terms/).check();
  await page.getByRole("button", { name: "Start your 15-day free trial" }).click();
  await page.getByText(/We sent a confirmation link/).waitFor();
  await page.goto(await confirmationLink(email));
  await page.waitForURL(/\/settings/);
  log("registered", email);

  // 1. PromptPay: QR page, then the payment arrives (simulated in test mode) and the plan is active
  await page.goto(`${BASE}/settings/billing/checkout?plan=pro_month`);
  await page.getByText(/Opn Payments test mode/).waitFor();
  await page.getByRole("button", { name: "Pay ฿266.43" }).click();
  await page.waitForURL(/\/settings\/billing\/pay\//);
  await page.getByText("Scan to pay with PromptPay", { exact: true }).waitFor();
  await page.getByRole("img", { name: "Scan to pay with PromptPay" }).waitFor();
  await page.getByText("Waiting for payment…").waitFor();
  await shot("o1-promptpay-qr");
  if (!/^pending:omise:chrg_test_$/.test(charges())) fail(`expected one pending Opn charge, got ${charges()}`);
  await page.getByRole("button", { name: "Simulate paying (test mode)" }).click();
  await page.waitForURL(/\/settings\/billing\?paid=/);
  await page.getByText("Payment received. Thank you!").waitFor();
  await page.getByText(/Pro · monthly, paid until/).first().waitFor();
  log("PromptPay: QR shown, payment settles the plan");

  // 2. PromptPay paid in the banking app while the page waits: the page's status check picks it up
  await page.goto(`${BASE}/settings/billing/checkout?plan=pro_month`);
  await page.getByRole("button", { name: "Pay ฿266.43" }).click();
  await page.waitForURL(/\/settings\/billing\/pay\//);
  const ref = psql(`select provider_ref from billing_charges where owner_id = (select id from auth.users where email = '${email}') and status = 'pending'`);
  await fetch(`${OMISE}/charges/${ref}/mark_as_paid`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from("skey_test_x:").toString("base64")}` } });
  await page.waitForURL(/\/settings\/billing\?paid=/, { timeout: 15000 });
  log("PromptPay: the waiting page notices the payment by itself");

  // 3. Card, no 3-D Secure; card fields never reach Tra's server
  const posted = [];
  page.on("request", (r) => r.method() === "POST" && r.url().startsWith(BASE) && posted.push(r.postData() ?? ""));
  const payByCard = async (number) => {
    await page.goto(`${BASE}/settings/billing/checkout?plan=pro_year`);
    await page.getByLabel(/Credit or debit card/).check();
    await page.getByLabel("Name on card").fill("NATCHA PAYER");
    await page.getByLabel("Card number").fill(number);
    await page.getByLabel("Expiry (MM/YY)").fill("12/30");
    await page.getByLabel("CVC").fill("123");
    await page.getByRole("button", { name: "Pay ฿2,664.30" }).click();
  };
  await payByCard("4242424242424242");
  await page.waitForURL(/\/settings\/billing\?paid=/);
  await page.getByText(/Pro · yearly, paid until/).first().waitFor();
  if (posted.some((p) => p.includes("4242424242424242") || p.includes("NATCHA PAYER"))) fail("card details were sent to Tra's server");
  log("card: paid at once; card details stayed in the browser");

  // 4. Card with 3-D Secure: off to the bank's page and back to the pay page, which settles it
  await payByCard("4111111111111111");
  await page.waitForURL(/\/settings\/billing\?paid=/);
  log("card with 3-D Secure: bank page, then back and paid");

  // 5. Declined card: error on the checkout, nothing charged
  await payByCard("4000000000000002");
  await page.getByText(/The payment didn't go through: insufficient funds/).waitFor();
  await shot("o2-declined");
  log("declined card shows the bank's reason");

  // 6. Webhook: settles a charge by fetching it from Opn; a forged or unknown charge changes nothing
  await page.goto(`${BASE}/settings/billing/checkout?plan=pro_month`);
  await page.getByRole("button", { name: "Pay ฿266.43" }).click();
  await page.waitForURL(/\/settings\/billing\/pay\//);
  const chargeId = page.url().split("/").pop();
  await page.close(); // nobody is watching the page now
  const pending = psql(`select provider_ref from billing_charges where id = '${chargeId}'`);
  const hook = (body) => fetch(`${BASE}/api/omise/webhook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let r = await hook({ key: "charge.complete", data: { object: "charge", id: pending, status: "successful", paid: true } });
  if ((await r.text()) !== "pending" || psql(`select status from billing_charges where id = '${chargeId}'`) !== "pending") fail("a webhook claiming success must not settle an unpaid charge");
  r = await hook({ key: "charge.complete", data: { object: "charge", id: "chrg_test_forged" } });
  if (r.status !== 500) fail(`unknown charge should fail, got ${r.status}`);
  await fetch(`${OMISE}/charges/${pending}/mark_as_paid`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from("skey_test_x:").toString("base64")}` } });
  r = await hook({ key: "charge.complete", data: { object: "charge", id: pending } });
  if ((await r.text()) !== "paid" || psql(`select status from billing_charges where id = '${chargeId}'`) !== "paid") fail("webhook should settle the paid charge");
  r = await hook({ key: "charge.complete", data: { object: "charge", id: pending } });
  if ((await r.text()) !== "paid") fail("a repeated webhook should be harmless");
  log("webhook settles from Opn's own record; claims in the body are ignored; repeats are harmless");

  // 7. The subscription adds up: 3 months + 2 years beyond the trial, nothing paid twice
  const summary = psql(`select string_agg(status, ',' order by created_at) from billing_charges where owner_id = (select id from auth.users where email = '${email}')`);
  if (summary !== "paid,paid,paid,paid,failed,paid") fail(`unexpected charges: ${summary}`);
  const months = psql(`select round(extract(epoch from current_period_end - trial_ends_at) / 86400 / 30.4) from subscriptions where owner_id = (select id from auth.users where email = '${email}')`);
  if (months !== "27") fail(`expected about 27 months paid after the trial, got ${months}`);
  log("charges:", summary, "· months paid after the trial:", months);
  console.log("\nOPN CHECKOUT PASSED");
} finally {
  await browser.close();
}
