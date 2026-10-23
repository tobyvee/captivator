import type { CSSProperties } from "react";

/**
 * `px` plus that edge's safe area, for anything placed against the edge. The export opts into
 * `viewport-fit=cover`, so the page runs under Android's gesture bar, iOS's home indicator and, in
 * landscape, the notch; elsewhere the insets are 0 (T-038-export-draws-under-gesture-bar.md).
 */
export const clearOfEdge = (edge: "bottom" | "left" | "right", px: number) =>
  `calc(${px}px + env(safe-area-inset-${edge}, 0px))`;

/**
 * The guest page's centred column, shared by SplashPage and the Connected screen so the logo sits
 * in the same place on both. Its 40px bottom padding keeps the last button clear of the photo
 * credit in the bottom-right corner, which moves up with the safe area as well.
 */
export const COLUMN: CSSProperties = {
  position: "relative",
  zIndex: 1,
  flex: "1 0 auto",
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 18,
  maxWidth: 420,
  margin: "0 auto",
  padding: "56px 28px 40px",
  // A separate key, not part of the shorthand: jsdom drops a declaration with env(), and would
  // lose the whole padding.
  paddingBottom: clearOfEdge("bottom", 40),
  boxSizing: "border-box",
  textAlign: "center",
};
