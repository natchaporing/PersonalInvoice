import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** Landing point of the confirmation link in the signup email (PKCE `code`, or `token_hash` for custom templates). */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/settings";

  // Neither a code nor a token hash: Supabase put the result in the URL fragment (a resent email does this).
  // Browsers keep the fragment across this redirect, and the login page picks it up.
  if (!code && !(tokenHash && type)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type && TYPES.includes(type)) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;

  const url = request.nextUrl.clone();
  url.search = "";
  if (ok) {
    url.pathname = dest;
    url.searchParams.set("confirmed", "1");
  } else {
    url.pathname = "/login";
    url.searchParams.set("error", "confirm_failed");
  }
  return NextResponse.redirect(url);
}
