import { describe, expect, it } from "vitest";
import { taxIdChecksumOk, isJuristicTaxId } from "@/lib/thai/tax-id";
import { accessFor, canIssue, nextPeriod, PLANS, vatInclusive, yearlySavingPct } from "./billing";

const now = new Date("2026-10-02T12:00:00Z");
const sub = (o: Partial<{ plan: string | null; trial_ends_at: string; current_period_end: string | null }>) => ({
  plan: null,
  trial_ends_at: "2026-10-10T12:00:00Z",
  current_period_end: null,
  ...o,
});

describe("accessFor", () => {
  it("counts trial days left, rounding up", () => {
    expect(accessFor(sub({}), now)).toMatchObject({ kind: "trial", daysLeft: 8 });
    expect(accessFor(sub({ trial_ends_at: "2026-10-02T13:00:00Z" }), now)).toMatchObject({ kind: "trial", daysLeft: 1 });
  });
  it("expires when the trial ends and nothing is paid", () => {
    const a = accessFor(sub({ trial_ends_at: "2026-10-01T00:00:00Z" }), now);
    expect(a.kind).toBe("expired");
    expect(canIssue(a)).toBe(false);
  });
  it("a paid period wins over the trial and remembers the remaining trial", () => {
    const a = accessFor(sub({ plan: "pro_year", current_period_end: "2027-10-10T12:00:00Z" }), now);
    expect(a).toMatchObject({ kind: "paid", plan: "pro_year" });
    expect(a.kind === "paid" && a.trialEndsAt?.toISOString()).toBe("2026-10-10T12:00:00.000Z");
  });
  it("a lapsed paid period is expired, dated by its own end", () => {
    const a = accessFor(sub({ plan: "pro_month", trial_ends_at: "2026-08-01T00:00:00Z", current_period_end: "2026-09-15T00:00:00Z" }), now);
    expect(a).toEqual({ kind: "expired", endedAt: new Date("2026-09-15T00:00:00Z") });
  });
  it("complimentary accounts never expire; no row means no access", () => {
    expect(accessFor(sub({ plan: "comp", trial_ends_at: "2020-01-01T00:00:00Z" }), now)).toEqual({ kind: "comp" });
    expect(canIssue(accessFor(null, now))).toBe(false);
  });
});

describe("prices", () => {
  it("splits VAT out of the inclusive price", () => {
    expect(vatInclusive(PLANS.pro_year.price)).toEqual({ net: 232710, vat: 16290 });
    expect(vatInclusive(PLANS.pro_month.price)).toEqual({ net: 23271, vat: 1629 });
  });
  it("yearly saves about 17% over monthly", () => expect(yearlySavingPct()).toBe(17));
});

describe("tax IDs", () => {
  it("checks the checksum digit", () => {
    expect(taxIdChecksumOk("1101700123456")).toBe(true);
    expect(taxIdChecksumOk("1101700123457")).toBe(false);
    expect(taxIdChecksumOk("3101700123456")).toBe(false);
    expect(taxIdChecksumOk("1234567890121")).toBe(true);
    expect(taxIdChecksumOk("12345")).toBe(false);
  });
  it("spots company IDs by the leading 0", () => {
    expect(isJuristicTaxId("0105561000001")).toBe(true);
    expect(isJuristicTaxId("1234567890121")).toBe(false);
  });
});

describe("nextPeriod", () => {
  it("starts after the trial when paying during it", () => {
    const p = nextPeriod(sub({}), "pro_year", now);
    expect(p.start.toISOString()).toBe("2026-10-10T12:00:00.000Z");
    expect(p.end.toISOString()).toBe("2027-10-10T12:00:00.000Z");
  });
  it("starts now once access has lapsed, and stacks on a running paid period", () => {
    expect(nextPeriod(sub({ trial_ends_at: "2026-01-01T00:00:00Z" }), "pro_month", now).end.toISOString()).toBe("2026-11-02T12:00:00.000Z");
    expect(nextPeriod(sub({ current_period_end: "2026-12-01T00:00:00Z" }), "pro_month", now).start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
});
