import type { JSX } from "react";
import type { Design } from "../lib/design-schema";
import type { RenderMode } from "../lib/types";

export type ConnectedProps = { design: Design; mode: RenderMode; onContinue?: () => void };

// Stub from T-005; T-022 replaces it with the "You're online" screen.
export function Connected(props: ConnectedProps): JSX.Element | null {
  void props;
  return null;
}
