// Generates a JWT secret plus anon/service_role keys for the local stack and writes .env.
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

const out = new URL("./.env", import.meta.url);
if (existsSync(out)) { console.log("supabase/local/.env already exists"); process.exit(0); }
const secret = randomBytes(32).toString("hex");
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (role) => {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ iss: "supabase-local", role, iat: 1700000000, exp: 2000000000 });
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
};
writeFileSync(out, [
  `JWT_SECRET=${secret}`,
  `ANON_KEY=${jwt("anon")}`,
  `SERVICE_ROLE_KEY=${jwt("service_role")}`,
  `POSTGRES_PASSWORD=${randomBytes(12).toString("hex")}`,
].join("\n") + "\n");
console.log("wrote supabase/local/.env");
