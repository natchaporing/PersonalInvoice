import { formatDateEN, formatDateTH } from "@/lib/thai/thai-date";
import { DOC_TYPE_LABEL, type DocType } from "@/lib/domain/documents";
import type { Locale } from "./config";

/** A "YYYY-MM-DD" date in the UI language: "17 ตุลาคม พ.ศ. 2569" or "17 October 2026". */
export const formatDate = (iso: string, locale: Locale) => (locale === "th" ? formatDateTH(iso) : formatDateEN(iso));

/** A document type's name in the UI language. */
export const docTypeLabel = (t: DocType, locale: Locale) => DOC_TYPE_LABEL[t][locale];
