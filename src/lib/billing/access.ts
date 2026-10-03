import "server-only";
import { cache } from "react";
import { accessFor } from "@/lib/domain/billing";
import { todayBangkok } from "@/lib/domain/documents";
import type { Locale } from "@/lib/i18n/config";
import { formatDate } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/server";

/** The signed-in account's subscription and what it allows. Cached per request (layout + page share it). */
export const getAccess = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("*").maybeSingle();
  return { sub: data, access: accessFor(data) };
});

/** A timestamp as a Bangkok calendar date in the UI language, e.g. "17 October 2026" or "17 ตุลาคม พ.ศ. 2569". */
export const bkkDate = (d: Date | string, locale: Locale) => formatDate(todayBangkok(new Date(d)), locale);

/** Test payments run only when the server holds the secret that the database also stores. */
export const testPaymentsEnabled = () => !!process.env.BILLING_TEST_SECRET;
