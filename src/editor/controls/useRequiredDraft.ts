"use client";

import { useState } from "react";

/**
 * A local draft for a text input whose stored value may not be empty
 * (T-004-store-rejects-invalid-designs, T-015-required-draft-hook).
 *
 * - `missing` is true while the draft's `trim()` is empty; such a draft is never committed.
 * - Any other draft is committed as typed, untrimmed, so spaces between words survive typing.
 * - The draft follows `stored` whenever it changes from outside (undo, a template switch).
 */
export function useRequiredDraft(stored: string, commit: (value: string) => void) {
  const [draft, setDraft] = useState(stored);
  // Adjusted during render rather than in an effect, so the input never shows a stale value.
  const [synced, setSynced] = useState(stored);
  if (stored !== synced) {
    setSynced(stored);
    setDraft(stored);
  }

  return {
    draft,
    missing: draft.trim() === "",
    onChange(value: string) {
      setDraft(value);
      if (value.trim() !== "") commit(value);
    },
  };
}
