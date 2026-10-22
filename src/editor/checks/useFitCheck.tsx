"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Design } from "@/lib/design-schema";
import { FIT_WIDTH, isTooTall } from "@/lib/fit";
import { SplashPage } from "@/splash/SplashPage";

export type FitCheck = {
  tooTall: boolean; // the content passes the small-phone fold
  height: number | null; // the measured content height at 375px wide, once known
  probe: ReactNode; // the hidden measuring render, which PreviewStage mounts
};

// Off screen, unseen, unheard and unclickable. `height: 0; overflow: hidden` keeps a tall page
// from adding scrollable overflow to the editor; the splash root inside keeps its own height
// (T-028-probe-clips-to-zero-height).
const PROBE: CSSProperties = {
  position: "absolute",
  left: -10000,
  top: 0,
  width: FIT_WIDTH,
  height: 0,
  overflow: "hidden",
  visibility: "hidden",
  pointerEvents: "none",
};

/**
 * Measures the landing page's content height at 375px wide, as on an iPhone SE's login sheet.
 * The probe renders SplashPage compact (no spacer) and without `inFrame` (no min-height), so the
 * root's height is its content's. A ResizeObserver on the root re-measures it whenever the design
 * or an image load changes that height. Where ResizeObserver is missing, the height stays unknown
 * and nothing warns.
 */
export function useFitCheck(design: Design): FitCheck {
  const probeRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    // SplashPage always renders the same root element, so observing it once covers every design.
    // Picked by tag rather than as the first child, because a server render puts a <link
    // rel="preload"> for the background photo ahead of it.
    const root = probeRef.current?.querySelector(":scope > div");
    if (!root || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(root.scrollHeight));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const probe = (
    <div ref={probeRef} aria-hidden="true" inert style={PROBE}>
      <SplashPage design={design} screen="landing" mode="preview" compact />
    </div>
  );

  return { tooTall: height !== null && isTooTall(height), height, probe };
}
