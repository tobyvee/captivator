// Which guest screens a form can produce. Pure: shared by the store's screen rules and the
// editor's screen switcher, so they can't drift apart.
import type { FormSpec } from "./types";

/** Whether a guest can fail Connect at all: a field to fill in or a box to tick. */
export function canFail(form: FormSpec): boolean {
  return form.fields.length > 0 || form.terms.mode === "checkbox";
}
