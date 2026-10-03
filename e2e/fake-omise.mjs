// A stand-in for the Opn Payments (Omise) API, for running the checkout locally without network access.
// Usage: node e2e/fake-omise.mjs [port]   then start the app with OMISE_API_BASE=http://localhost:<port>
// Card tokens: tokn_test_ok pays at once, tokn_test_3ds goes through a fake 3-D Secure page, tokn_test_fail is declined.
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.argv[2] ?? 3200);
const BASE = `http://localhost:${PORT}`;
const charges = new Map();

const send = (res, status, body, type = "application/json") => {
  res.writeHead(status, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(body) : body);
};
const error = (res, status, code, message) => send(res, status, { object: "error", code, message });

createServer(async (req, res) => {
  const url = new URL(req.url, BASE);
  const [, a, id, action] = url.pathname.split("/");

  // Browser-facing pages (no auth): the QR image and the bank's 3-D Secure page.
  if (a === "qr") return send(res, 200, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/><text x="1" y="6" font-size="3" fill="#fff">QR</text></svg>`, "image/svg+xml");
  if (a === "authorize") {
    const c = charges.get(id);
    if (!c) return error(res, 404, "not_found", "charge not found");
    Object.assign(c, { status: "successful", paid: true });
    res.writeHead(302, { Location: c.return_uri });
    return res.end();
  }

  if (!req.headers.authorization?.startsWith("Basic ") || !Buffer.from(req.headers.authorization.slice(6), "base64").toString().startsWith("skey_test_")) {
    return error(res, 401, "authentication_failure", "authentication failed");
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const form = new URLSearchParams(body);

  if (a === "charges" && !id && req.method === "POST") {
    const cid = `chrg_test_${randomBytes(6).toString("hex")}`;
    const token = form.get("card");
    const c = {
      object: "charge",
      id: cid,
      amount: Number(form.get("amount")),
      currency: form.get("currency"),
      description: form.get("description"),
      metadata: { charge_id: form.get("metadata[charge_id]") },
      return_uri: form.get("return_uri"),
      status: "pending",
      paid: false,
      authorize_uri: null,
      failure_code: null,
      failure_message: null,
      source: null,
    };
    if (token === "tokn_test_ok") Object.assign(c, { status: "successful", paid: true });
    else if (token === "tokn_test_fail") Object.assign(c, { status: "failed", failure_code: "insufficient_fund", failure_message: "insufficient funds in the account" });
    else if (token === "tokn_test_3ds") c.authorize_uri = `${BASE}/authorize/${cid}`;
    else if (form.get("source[type]") === "promptpay") c.source = { type: "promptpay", scannable_code: { type: "qr", image: { download_uri: `${BASE}/qr/${cid}.svg` } } };
    else return error(res, 400, "invalid_card", "card or source is required");
    charges.set(cid, c);
    return send(res, 200, c);
  }
  const c = charges.get(id);
  if (a === "charges" && !c) return error(res, 404, "not_found", "charge was not found");
  if (a === "charges" && !action && req.method === "GET") return send(res, 200, c);
  if (a === "charges" && action === "mark_as_paid" && req.method === "POST") {
    Object.assign(c, { status: "successful", paid: true });
    return send(res, 200, c);
  }
  error(res, 404, "not_found", "unknown endpoint");
}).listen(PORT, () => console.log(`fake Opn API on ${BASE}`));
