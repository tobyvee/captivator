"use client";

import { useStore } from "@/lib/store";
import type { Screen } from "@/lib/types";
import { Segmented, type SegmentedOption } from "./controls/Segmented";

const LANDING: SegmentedOption<Screen> = { value: "landing", label: "Landing" };
const TERMS: SegmentedOption<Screen> = { value: "terms", label: "Terms" };

/** Picks the guest screen the preview shows. Terms is offered only while terms are on. */
export function ScreenSwitcher() {
  const termsOn = useStore((s) => s.design.form.terms.mode === "checkbox");
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const options = termsOn ? [LANDING, TERMS] : [LANDING];

  return <Segmented label="Preview screen" options={options} value={screen} onChange={setScreen} />;
}
