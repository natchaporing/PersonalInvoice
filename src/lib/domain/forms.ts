// Shared parsing for form fields (FormData → typed values).
import { z } from "zod";
import { thbToSatang } from "@/lib/thai/money";

/** Optional trimmed text: empty string becomes null. */
export const optText = (max = 500) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v), z.string().max(max).nullable());

export const reqText = (label: string, max = 500) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1, `${label} is required`).max(max));

export const taxId = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[\s-]/g, "") : v),
  z.string().regex(/^\d{13}$/, "Tax ID must be 13 digits"),
);
export const optTaxId = z.preprocess(
  (v) => (typeof v === "string" ? (v.replace(/[\s-]/g, "") || null) : v),
  z.string().regex(/^\d{13}$/, "Tax ID must be 13 digits").nullable(),
);
export const branchCode = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? "00000" : v.trim().padStart(5, "0")) : v),
  z.string().regex(/^\d{5}$/, "Branch number is 5 digits (00000 = head office)"),
);

/** "1,234.50" → 123450 satang. */
export const money = (label: string) =>
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    const n = Number(v.replace(/,/g, "").trim() || "0");
    return Number.isFinite(n) ? thbToSatang(n) : NaN;
  }, z.number({ message: `${label} must be a number` }).int().min(0, `${label} cannot be negative`));

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const formObject = (form: FormData) => Object.fromEntries(form.entries());

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Submitted text values, echoed back on error so the form (which React resets) keeps what was typed. */
  values?: Record<string, string>;
}

/** Text fields of a submission (files skipped), for echoing back in FormState.values. */
export function submitted(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/** An error result that keeps the user's input. */
export function invalid(form: FormData, issues: { path: PropertyKey[]; message: string }[], error = "Please fix the highlighted fields."): FormState {
  return { error, fieldErrors: fieldErrors(issues), values: submitted(form) };
}

/** Turn zod issues into a field → message map. */
export function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
