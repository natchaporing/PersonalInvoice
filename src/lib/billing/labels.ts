import type { PlanKey } from "@/lib/domain/billing";
import type { Messages } from "@/lib/i18n/messages";

/** A plan's name in the UI language. */
export const planLabel = (k: PlanKey, m: Messages) => (k === "pro_year" ? m.billing.planYear : m.billing.planMonth);
