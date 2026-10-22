import type { JSX } from "react";
import type { Design } from "../lib/design-schema";
import type { RenderMode } from "../lib/types";

export type TermsSheetProps = { design: Design; mode: RenderMode; onClose?: () => void };

// Stub from T-005; T-021 replaces it with the terms sheet (open, or a :target section in export).
export function TermsSheet(props: TermsSheetProps): JSX.Element | null {
  void props;
  return null;
}
