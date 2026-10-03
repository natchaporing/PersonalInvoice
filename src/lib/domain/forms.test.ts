import { describe, expect, it } from "vitest";
import { optTaxId, optText, postcode } from "./forms";

describe("optional form fields", () => {
  // A disabled <select> (e.g. district before a province is chosen) is left out of the form data entirely.
  it("treat a missing field like an empty one", () => {
    expect(optText(10).parse(undefined)).toBeNull();
    expect(optText(10).parse("  ")).toBeNull();
    expect(optText(10).parse(" ab ")).toBe("ab");
    expect(optTaxId.parse(undefined)).toBeNull();
    expect(postcode.parse(undefined)).toBeNull();
    expect(postcode.parse("10110")).toBe("10110");
  });
});
