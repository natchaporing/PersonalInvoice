import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Routes that work without a session.
const PUBLIC = [/^\/login(\/|$)/, /^\/register(\/|$)/, /^\/welcome(\/|$)/, /^\/terms(\/|$)/, /^\/auth\//, /^\/verify(\/|$)/, /^\/art\//, /^\/api\/omise\/webhook$/];

/** Refreshes the Supabase session on every request and sends signed-out visitors to /login. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Validates the token (not just decodes it) and refreshes it when needed.
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  // Traffic data the Computer Crime Act asks service providers to keep (90 days minimum). Prefetches are not visits.
  if (data.user && !request.headers.get("next-router-prefetch") && request.headers.get("purpose") !== "prefetch") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
    await supabase
      .rpc("log_access", { p_ip: ip, p_method: request.method, p_path: path, p_user_agent: request.headers.get("user-agent") ?? "" })
      .then(({ error }) => error && console.error("access log", error.message), (e) => console.error("access log", e));
  }
  if (!data.user && !PUBLIC.some((re) => re.test(path))) {
    const to = request.nextUrl.clone();
    // The bare address shows the product to visitors; deeper links go to sign-in and come back.
    to.pathname = path === "/" ? "/welcome" : "/login";
    to.search = path === "/" ? "" : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  // Skip Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
