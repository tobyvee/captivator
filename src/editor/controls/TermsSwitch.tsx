"use client";

import { useStore } from "@/lib/store";
import { Switch } from "./Switch";

/** Turns the terms checkbox on or off. Shown on the block list's Terms row and in the Terms inspector. */
export function TermsSwitch() {
  const on = useStore((s) => s.design.form.terms.mode === "checkbox");
  const updateForm = useStore((s) => s.updateForm);
  return (
    <Switch
      label="Show terms checkbox"
      checked={on}
      onChange={(checked) => updateForm({ terms: { mode: checked ? "checkbox" : "off" } })}
    />
  );
}
