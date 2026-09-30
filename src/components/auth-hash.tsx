"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getHash = () => window.location.hash;

/**
 * Handles the other way Supabase can finish an email link: tokens (or an error) in the URL fragment,
 * which the server never sees. This is what a *resent* confirmation email does, because resend can't
 * carry the PKCE challenge. Tokens sign the user in; an error shows `onError`.
 */
export function AuthHash({ children }: { children: (state: { failed: boolean }) => React.ReactNode }) {
  const router = useRouter();
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const failed = params.has("error") || params.has("error_code");

  useEffect(() => {
    if (!accessToken || !refreshToken) return;
    createBrowserSupabase()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        history.replaceState(null, "", window.location.pathname); // don't leave tokens in the address bar
        if (!error) router.replace("/settings?confirmed=1");
      });
  }, [accessToken, refreshToken, router]);

  return <>{children({ failed })}</>;
}
