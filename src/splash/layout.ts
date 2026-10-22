import type { CSSProperties } from "react";

/**
 * The guest page's centred column, shared by SplashPage and the Connected screen so the logo sits
 * in the same place on both. Its 40px bottom padding keeps the last button clear of the photo
 * credit in the bottom-right corner.
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
  boxSizing: "border-box",
  textAlign: "center",
};
