import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ContractRow } from "@/lib/data/contracts";
import { supabaseEnv } from "@/lib/supabase/server";

/** A client reading a contract through its signing link: no session, only what the token unlocks. */
export function anonClient() {
  const { url, key } = supabaseEnv();
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function contractByToken(token: string) {
  if (!/^[\w-]{32,}$/.test(token)) return null;
  const { data } = await anonClient().rpc("contract_for_signing", { p_token: token });
  return (data ?? null) as unknown as Omit<ContractRow, "owner_id" | "client_sign_ip" | "client_sign_ua"> | null;
}
