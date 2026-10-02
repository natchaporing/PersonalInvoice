import "server-only";
import { cache } from "react";
import { accessFor } from "@/lib/domain/billing";
import { todayBangkok } from "@/lib/domain/documents";
import { formatDateEN } from "@/lib/thai/thai-date";
import { createClient } from "@/lib/supabase/server";

/** The signed-in account's subscription and what it allows. Cached per request (layout + page share it). */
export const getAccess = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("*").maybeSingle();
  return { sub: data, access: accessFor(data) };
});

/** A timestamp as a Bangkok calendar date, e.g. "17 October 2026". */
export const bkkDate = (d: Date | string) => formatDateEN(todayBangkok(new Date(d)));

/** Test payments run only when the server holds the secret that the database also stores. */
export const testPaymentsEnabled = () => !!process.env.BILLING_TEST_SECRET;
