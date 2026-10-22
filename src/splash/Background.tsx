import type { JSX } from "react";
import type { BackgroundSpec, RenderMode } from "../lib/types";

export type BackgroundProps = { background: BackgroundSpec; mode: RenderMode };

// Stub from T-005; T-006 replaces it with the colour, gradient and photo layers.
export function Background(props: BackgroundProps): JSX.Element | null {
  void props;
  return null;
}
