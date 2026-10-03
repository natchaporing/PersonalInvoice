// Shared parsing for form fields (FormData → typed values).
import { z } from "zod";
import { thbToSatang } from "@/lib/thai/money";

/** Validation wording, supplied in the visitor's language (see i18n messages `validation`). */
export interface ValidationMessages {
  required: (label: string) => string;
  taxId13: string;
  branch5: string;
  number: (label: string) => string;
  negative: (label: string) => string;
  postcode5: string;
  fixFields: string;
}

const EN: ValidationMessages = {
  required: (label) => `${label} is required`,
  taxId13: "Tax ID must be 13 digits",
  branch5: "Branch number is 5 digits (00000 = head office)",
  number: (label) => `${label} must be a number`,
  negative: (label) => `${label} cannot be negative`,
  postcode5: "Postcode is 5 digits",
  fixFields: "Please fix the highlighted fields.",
};

/** Field parsers whose error messages are in the given language. */
export function formHelpers(v: ValidationMessages = EN) {
  return {
    /** Optional trimmed text: empty string becomes null. */
    optText: (max = 500) =>
      z.preprocess((x) => (typeof x === "string" && x.trim() === "" ? null : typeof x === "string" ? x.trim() : x), z.string().max(max).nullable()),
    reqText: (label: string, max = 500) =>
      z.preprocess((x) => (typeof x === "string" ? x.trim() : x), z.string().min(1, v.required(label)).max(max)),
    taxId: z.preprocess((x) => (typeof x === "string" ? x.replace(/[\s-]/g, "") : x), z.string().regex(/^\d{13}$/, v.taxId13)),
    optTaxId: z.preprocess((x) => (typeof x === "string" ? (x.replace(/[\s-]/g, "") || null) : x), z.string().regex(/^\d{13}$/, v.taxId13).nullable()),
    branchCode: z.preprocess(
      (x) => (typeof x === "string" ? (x.trim() === "" ? "00000" : x.trim().padStart(5, "0")) : x),
      z.string().regex(/^\d{5}$/, v.branch5),
    ),
    /** "1,234.50" → 123450 satang. */
    money: (label: string) =>
      z.preprocess((x) => {
        if (typeof x !== "string") return x;
        const n = Number(x.replace(/,/g, "").trim() || "0");
        return Number.isFinite(n) ? thbToSatang(n) : NaN;
      }, z.number({ message: v.number(label) }).int().min(0, v.negative(label))),
    postcode: z.preprocess((x) => (typeof x === "string" ? x.replace(/\D/g, "") || null : x), z.string().regex(/^\d{5}$/, v.postcode5).nullable()),
    v,
  };
}

// English defaults for code that has not moved to formHelpers(m.validation) yet.
const en = formHelpers();
export const { optText, reqText, taxId, optTaxId, branchCode, money } = en;

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
export function invalid(form: FormData, issues: { path: PropertyKey[]; message: string }[], error = EN.fixFields): FormState {
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
