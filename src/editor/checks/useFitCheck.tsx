"use client";

import type { ReactNode } from "react";
import type { Design } from "@/lib/design-schema";

export type FitCheck = {
  tooTall: boolean; // the content passes the small-phone fold
  height: number | null; // the measured content height at 375px wide, once known
  probe: ReactNode; // the hidden measuring render, which PreviewStage mounts
};

// Stub from T-009; T-028 replaces this file with the small-phone fit measurement.
export function useFitCheck(design: Design): FitCheck {
  void design;
  return { tooTall: false, height: null, probe: null };
}
