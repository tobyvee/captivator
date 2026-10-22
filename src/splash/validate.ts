// Guest-side checks for the editor's Error and Connected screens. Pure: no DOM, no React.
import type { FieldKindSpec, FormSpec } from "../lib/types";

/** What a failed Connect says, per field and for unticked terms (T-022-error-copy-follows-spec). */
export const ERROR_COPY = {
  name: "Enter your name",
  email: "Enter a valid email",
  phone: "Enter a valid phone number",
  terms: "Please accept the terms",
} as const;

/** The value the Error screen shows in the failing field. */
export const EXAMPLE_INVALID: Record<FieldKindSpec, string> = {
  name: "",
  email: "sam@",
  phone: "12",
};

export type GuestCheck = { ok: boolean; field?: FieldKindSpec; terms?: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[+\d\s()-]*$/;

/** Whether a guest can fail Connect at all: a field to fill in or a box to tick. */
export function canFail(form: FormSpec): boolean {
  return form.fields.length > 0 || form.terms.mode === "checkbox";
}

function fieldValid(kind: FieldKindSpec, value: string): boolean {
  const v = value.trim();
  switch (kind) {
    case "name":
      return v.length > 0;
    case "email":
      return EMAIL.test(v);
    case "phone":
      return PHONE_CHARS.test(v) && (v.match(/\d/g)?.length ?? 0) >= 6;
  }
}

/** The first field that fails, in the design's order, and whether the terms box fails. */
export function validateGuest(
  fields: FieldKindSpec[],
  values: Partial<Record<FieldKindSpec, string>>,
  termsOn: boolean,
  termsChecked: boolean,
): GuestCheck {
  const field = fields.find((kind) => !fieldValid(kind, values[kind] ?? ""));
  const terms = termsOn && !termsChecked;
  return {
    ok: !field && !terms,
    ...(field ? { field } : null),
    ...(terms ? { terms } : null),
  };
}
