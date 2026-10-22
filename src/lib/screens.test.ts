import { describe, expect, it } from "vitest";
import { BLANK, type Design } from "./design-schema";
import { canFail } from "./screens";
import type { FieldKindSpec } from "./types";

const form = (fields: FieldKindSpec[], terms: "off" | "checkbox"): Design["form"] => ({
  ...BLANK.design.form,
  fields,
  terms: { ...BLANK.design.form.terms, mode: terms },
});

describe("canFail", () => {
  it("is false with no fields and terms off", () => {
    expect(canFail(form([], "off"))).toBe(false);
  });

  it("is true with a field or with terms on", () => {
    expect(canFail(form(["email"], "off"))).toBe(true);
    expect(canFail(form([], "checkbox"))).toBe(true);
    expect(canFail(form(["name", "phone"], "checkbox"))).toBe(true);
  });
});
