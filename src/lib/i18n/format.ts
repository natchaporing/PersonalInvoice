import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";
import type { Locale } from "./config";

/** A "YYYY-MM-DD" date in the UI language: "17 ตุลาคม พ.ศ. 2569" or "17 October 2026". */
export const formatDate = (iso: string, locale: Locale) => (locale === "th" ? formatDateTH(iso) : formatDateEN(iso));
