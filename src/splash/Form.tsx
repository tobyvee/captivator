import type { JSX } from "react";
import type { Design } from "../lib/design-schema";
import type { RenderMode, Screen, Selection } from "../lib/types";

export type FormProps = {
  design: Design;
  mode: RenderMode;
  screen: Screen;
  onSelect?: (s: Selection) => void;
  onScreenChange?: (s: Screen) => void;
};

// Stub from T-005; T-007 replaces it with the fields, terms row and Connect button.
export function Form(props: FormProps): JSX.Element | null {
  void props;
  return null;
}
