"use server";

import { headers } from "next/headers";
import type { FormState } from "@/lib/domain/forms";
import { getMessages } from "@/lib/i18n/server";
import { anonClient, contractByToken } from "./data";

/** The client signs: name, drawn signature, and the fingerprint of the text they read. */
export async function signContract(token: string, name: string, signature: string, hash: string): Promise<FormState> {
  const m = await getMessages();
  if (name.trim().length < 2 || !signature.startsWith("data:image/png;base64,")) return { error: m.contracts.needAll };
  const c = await contractByToken(token);
  if (!c || c.status !== "sent") return { error: m.contracts.notOpen };
  const h = await headers();
  const { error } = await anonClient().rpc("sign_contract", {
    p_token: token,
    p_name: name,
    p_signature: signature,
    p_hash: hash,
    p_ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "",
    p_ua: h.get("user-agent") ?? "",
  });
  if (error) return { error: error.message };
  return { message: m.contracts.thanks };
}
