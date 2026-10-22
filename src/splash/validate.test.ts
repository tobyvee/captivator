import { describe, expect, it } from "vitest";
import type { FieldKindSpec } from "../lib/types";
import { ERROR_COPY, EXAMPLE_INVALID, validateGuest } from "./validate";

describe("validateGuest", () => {
  it.each([
    ["sam@", false],
    ["sam@example", false],
    ["sam example@x.com", false],
    ["", false],
    ["sam@example.com", true],
    ["  sam@example.com ", true],
  ])("email %j is valid: %s", (email, ok) => {
    expect(validateGuest(["email"], { email }, false, false).ok).toBe(ok);
  });

  it.each([
    ["", false],
    ["   ", false],
    ["Sam", true],
  ])("name %j is valid: %s", (name, ok) => {
    expect(validateGuest(["name"], { name }, false, false).ok).toBe(ok);
  });

  it.each([
    ["12", false],
    ["12345", false],
    ["0400 abc 000", false],
    ["+61 400 000 000", true],
    ["(02) 9999-0000", true],
    ["123456", true],
  ])("phone %j is valid: %s", (phone, ok) => {
    expect(validateGuest(["phone"], { phone }, false, false).ok).toBe(ok);
  });

  it("treats a missing value as empty", () => {
    expect(validateGuest(["name"], {}, false, false)).toEqual({ ok: false, field: "name" });
  });

  it("reports the first failing field in the design's order", () => {
    const values = { name: "", email: "sam@" };
    expect(validateGuest(["email", "name"], values, false, false).field).toBe("email");
    expect(validateGuest(["name", "email"], values, false, false).field).toBe("name");
    expect(validateGuest(["name", "email"], { name: "Sam", email: "sam@" }, false, false)).toEqual({
      ok: false,
      field: "email",
    });
  });

  it("fails unticked terms only while terms are on", () => {
    expect(validateGuest([], {}, true, false)).toEqual({ ok: false, terms: true });
    expect(validateGuest([], {}, true, true)).toEqual({ ok: true });
    expect(validateGuest([], {}, false, false)).toEqual({ ok: true });
  });

  it("reports a failing field and unticked terms together", () => {
    expect(validateGuest(["email"], { email: "" }, true, false)).toEqual({
      ok: false,
      field: "email",
      terms: true,
    });
  });

  it("passes valid fields with the box ticked", () => {
    const values = { name: "Sam", email: "sam@example.com", phone: "+61 400 000 000" };
    expect(validateGuest(["name", "email"], values, true, true)).toEqual({ ok: true });
  });
});

describe("error copy and examples", () => {
  it("uses the spec's wording", () => {
    expect(ERROR_COPY).toEqual({
      name: "Enter your name",
      email: "Enter a valid email",
      phone: "Enter a valid phone number",
      terms: "Please accept the terms",
    });
  });

  it("every example value fails its own field", () => {
    for (const kind of Object.keys(EXAMPLE_INVALID) as FieldKindSpec[]) {
      const result = validateGuest([kind], EXAMPLE_INVALID, false, false);
      expect(result).toEqual({ ok: false, field: kind });
    }
  });
});
