import { describe, expect, it } from "vitest";
import { guillocheBand, guillocheField, guillocheRing, guillocheRosette, petalBand, prng, wovenRing } from "./geometry";

const all = {
  rosette: () => guillocheRosette().map((l) => l.d).join(""),
  wovenRing: () => wovenRing(),
  petalBand: () => petalBand(),
  band: () => guillocheBand(),
  field: () => guillocheField(),
  ring: () => guillocheRing(),
};

describe("banknote geometry", () => {
  it.each(Object.entries(all))("%s is deterministic, valid and bounded", (_, fn) => {
    const a = fn();
    expect(a).toBe(fn());
    expect(a.startsWith("M")).toBe(true);
    expect(a).not.toMatch(/NaN|Infinity/);
    expect(a.length).toBeLessThan(100_000);
  });

  it("band is periodic so tiles join seamlessly", () => {
    const d = guillocheBand({ width: 100, height: 20, lines: 1 });
    const nums = d.replace(/[ML]/g, " ").trim().split(/\s+/).map(Number);
    expect(nums[1]).toBeCloseTo(nums[nums.length - 1], 1);
  });

  it("prng is seeded", () => {
    expect(prng(1)()).toBe(prng(1)());
    expect(prng(1)()).not.toBe(prng(2)());
  });
});
