// Personal mode (TRA_COMMERCIAL unset): one owner, no public sign-up, landing page, terms, trial or billing.
// Start the app without TRA_COMMERCIAL, then:
// BASE_URL=http://localhost:3100 CHROMIUM_PATH=... LOCAL_DB_PASSWORD=... SUPABASE_URL=http://localhost:54321 SUPABASE_ANON_KEY=... node e2e/personal-mode.mjs
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SUPA = process.env.SUPABASE_URL ?? "http://localhost:54321";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const log = (...a) => console.log("•", ...a);
const fail = (msg) => { throw new Error(msg); };
const psql = (sql) => spawnSync("docker", ["exec", "-e", `PGPASSWORD=${process.env.LOCAL_DB_PASSWORD ?? ""}`, "personalinvoice-local-db-1", "psql", "-h", "127.0.0.1", "-U", "supabase_admin", "-d", "postgres", "-Atc", sql], { encoding: "utf8" }).stdout.trim();
const signUpApi = (email) => fetch(`${SUPA}/auth/v1/signup`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "correct-horse-battery" }) });

const before = psql("select signups_open from private.app_config");
const email = `me-${randomBytes(4).toString("hex")}@example.com`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-proxy-server"] });
try {
  // The owner's account (created while sign-up is briefly open, as the real owner's already exists)
  psql("update private.app_config set signups_open = true");
  if (!(await signUpApi(email)).ok) fail("could not create the owner account for the test");
  psql(`update auth.users set email_confirmed_at = now() where email = '${email}'`);
  psql("update private.app_config set signups_open = false");

  // 1. Nobody else can create an account, even straight through the auth API
  const res = await signUpApi(`stranger-${randomBytes(4).toString("hex")}@example.com`);
  if (res.ok) fail("sign-up through the auth API should be refused");
  log("auth API refuses new accounts:", res.status);

  const ctx = await browser.newContext();
  await ctx.addCookies([{ name: "lang", value: "en", url: BASE }]);
  const page = await ctx.newPage();

  // 2. Signed out: the bare address and every commercial page lead to sign-in, with no sign-up link
  for (const path of ["/", "/welcome", "/register", "/terms", "/billing"]) {
    await page.goto(`${BASE}${path}`);
    if (!new URL(page.url()).pathname.startsWith("/login")) fail(`${path} should go to /login, got ${page.url()}`);
  }
  if (await page.getByText(/free trial|New to Tra/).count()) fail("sign-in page should not offer a trial");
  const hook = await page.request.post(`${BASE}/api/omise/webhook`, { data: { key: "charge.complete", data: { object: "charge", id: "chrg_test_x" } } });
  if (hook.status() !== 404) fail(`payment webhook should be gone, got ${hook.status()}`);
  log("landing, register, terms and payments are off; sign-in has no sign-up link");

  // 3. The owner signs in: no trial or plan banners, no Billing tab, and billing pages lead back to Settings
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  await page.goto(`${BASE}/documents`);
  if (await page.getByText(/Free trial|Choose a plan|trial has ended/).count()) fail("no trial or plan banners in personal mode");
  await page.goto(`${BASE}/settings`);
  if (await page.getByRole("link", { name: "Billing" }).count()) fail("no Billing tab in personal mode");
  await page.goto(`${BASE}/settings/billing/checkout?plan=pro_year`);
  if (new URL(page.url()).pathname !== "/settings") fail(`billing should lead to /settings, got ${page.url()}`);
  log("owner works normally: no trial, plan or billing anywhere");
  console.log("\nPERSONAL MODE PASSED");
} finally {
  psql(`update private.app_config set signups_open = ${before === "t" || before === "true"}`);
  await browser.close();
}
