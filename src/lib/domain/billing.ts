import type { Tables } from "@/lib/supabase/database.types";

export const TRIAL_DAYS = 15;

export type PlanKey = "pro_year" | "pro_month";

/** Prices in satang, VAT included. The database's plan_price() is the source of truth for charges; keep in step. */
export const PLANS: Record<PlanKey, { label: string; th: string; price: number; period: string; periodTh: string }> = {
  pro_year: { label: "Pro · yearly", th: "รายปี", price: 249000, period: "year", periodTh: "ปี" },
  pro_month: { label: "Pro · monthly", th: "รายเดือน", price: 24900, period: "month", periodTh: "เดือน" },
};

export const isPlanKey = (v: unknown): v is PlanKey => v === "pro_year" || v === "pro_month";

/** Yearly saving against paying monthly for twelve months, in whole percent. */
export const yearlySavingPct = () => Math.round((1 - PLANS.pro_year.price / (PLANS.pro_month.price * 12)) * 100);

/** Splits a VAT-inclusive price into net + 7% VAT, rounding the VAT to the satang. */
export function vatInclusive(amount: number, vatBps = 700) {
  const vat = Math.round((amount * vatBps) / (10000 + vatBps));
  return { net: amount - vat, vat };
}

export type Access =
  | { kind: "comp" }
  | { kind: "paid"; plan: PlanKey | null; endsAt: Date; trialEndsAt: Date | null }
  | { kind: "trial"; endsAt: Date; daysLeft: number }
  | { kind: "expired"; endedAt: Date | null };

const DAY = 86_400_000;

/** What the account may do now. Mirrors has_entitlement() in the database, which is what actually enforces it. */
export function accessFor(sub: Pick<Tables<"subscriptions">, "plan" | "trial_ends_at" | "current_period_end"> | null, now = new Date()): Access {
  if (!sub) return { kind: "expired", endedAt: null };
  if (sub.plan === "comp") return { kind: "comp" };
  const trialEnd = new Date(sub.trial_ends_at);
  const paidEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  if (paidEnd && now < paidEnd) {
    return { kind: "paid", plan: isPlanKey(sub.plan) ? sub.plan : null, endsAt: paidEnd, trialEndsAt: now < trialEnd ? trialEnd : null };
  }
  if (now < trialEnd) return { kind: "trial", endsAt: trialEnd, daysLeft: Math.ceil((trialEnd.getTime() - now.getTime()) / DAY) };
  return { kind: "expired", endedAt: paidEnd && paidEnd > trialEnd ? paidEnd : trialEnd };
}

/**
 * The period a new payment buys. Same rule as apply_paid_charge() in the database: it starts when the trial or
 * the current paid period ends (whichever is later, never in the past), so paying early never loses days.
 */
export function nextPeriod(sub: Pick<Tables<"subscriptions">, "trial_ends_at" | "current_period_end"> | null, plan: PlanKey, now = new Date()) {
  const start = new Date(Math.max(now.getTime(), sub ? Date.parse(sub.trial_ends_at) : 0, sub?.current_period_end ? Date.parse(sub.current_period_end) : 0));
  const end = new Date(start);
  if (plan === "pro_year") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

export const canIssue = (a: Access) => a.kind !== "expired";
