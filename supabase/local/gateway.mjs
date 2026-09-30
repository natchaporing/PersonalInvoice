// Tiny stand-in for Supabase's API gateway: routes /auth/v1, /rest/v1 and /storage/v1 to the
// local containers, and turns an `apikey` header into a bearer token when none is sent.
import http from "node:http";

const routes = [
  ["/auth/v1", "http://127.0.0.1:9999"],
  ["/rest/v1", "http://127.0.0.1:3001"],
  ["/storage/v1", "http://127.0.0.1:5000"],
];
const port = Number(process.env.GATEWAY_PORT ?? 54321);

// Hosted Supabase answers browser calls with CORS headers; mirror that.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-supabase-api-version, accept-profile, content-profile, prefer",
  "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "access-control-max-age": "600",
};

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS).end(); return; }
  // The local GoTrue image writes email links as /verify (hosted Supabase writes /auth/v1/verify): accept both.
  const match = req.url.startsWith("/verify") ? ["", routes[0][1]] : routes.find(([prefix]) => req.url.startsWith(prefix));
  if (!match) { res.writeHead(404).end("no route"); return; }
  const [prefix, target] = match;
  const url = new URL(req.url.slice(prefix.length) || "/", target);
  const headers = { ...req.headers, host: url.host };
  if (!headers.authorization && headers.apikey) headers.authorization = `Bearer ${headers.apikey}`;
  const up = http.request(url, { method: req.method, headers }, (r) => {
    res.writeHead(r.statusCode ?? 502, { ...r.headers, ...CORS });
    r.pipe(res);
  });
  up.on("error", (e) => { res.writeHead(502).end(String(e)); });
  req.pipe(up);
}).listen(port, () => console.log(`local supabase gateway on http://localhost:${port}`));
