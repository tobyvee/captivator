"use client";

import { useStore } from "@/lib/store";
import type { Screen } from "@/lib/types";
import { canFail } from "@/splash/validate";
import { Segmented, type SegmentedOption } from "./controls/Segmented";

const LANDING: SegmentedOption<Screen> = { value: "landing", label: "Landing" };
const TERMS: SegmentedOption<Screen> = { value: "terms", label: "Terms" };
const ERROR: SegmentedOption<Screen> = { value: "error", label: "Error" };
const CONNECTED: SegmentedOption<Screen> = { value: "connected", label: "Connected" };

/**
 * Picks the guest screen the preview shows. Terms is offered only while terms are on, and Error
 * only while something can fail. The store moves the screen back to Landing when its option goes
 * away, so one option is always pressed.
 */
export function ScreenSwitcher() {
  const termsOn = useStore((s) => s.design.form.terms.mode === "checkbox");
  const errorOn = useStore((s) => canFail(s.design.form));
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const options = [
    LANDING,
    ...(termsOn ? [TERMS] : []),
    ...(errorOn ? [ERROR] : []),
    CONNECTED,
  ];

  return <Segmented label="Preview screen" options={options} value={screen} onChange={setScreen} />;
}
