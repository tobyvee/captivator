import { describe, expect, it } from "vitest";
import { FIT_WIDTH, FOLD_HEIGHT, isTooTall } from "./fit";

describe("isTooTall", () => {
  it("warns above 600px", () => {
    expect(isTooTall(601)).toBe(true);
  });

  it("doesn't warn at or below 600px", () => {
    expect(isTooTall(600)).toBe(false);
    expect(isTooTall(420)).toBe(false);
  });

  it("measures at an iPhone SE's 375 × 600 login sheet", () => {
    expect(FIT_WIDTH).toBe(375);
    expect(FOLD_HEIGHT).toBe(600);
  });
});
