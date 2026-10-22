"use client";

import { Redo2, Undo2 } from "lucide-react";

// Stub from T-008; T-025 replaces this file with working undo and redo (the design history
// and its keyboard shortcuts). Both buttons stay disabled until then.
const BUTTON =
  "flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50";

export function UndoRedo() {
  return (
    <>
      <button type="button" aria-label="Undo" disabled className={BUTTON}>
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Redo" disabled className={BUTTON}>
        <Redo2 size={16} aria-hidden="true" />
      </button>
    </>
  );
}
