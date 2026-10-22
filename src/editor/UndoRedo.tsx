"use client";

import { Redo2, Undo2 } from "lucide-react";
import { useEffect } from "react";
import { useStore as useStoreApi } from "zustand";
import { useStore } from "@/lib/store";

const BUTTON =
  "flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 enabled:hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

// Input types with their own text undo. Range sliders, checkboxes and the like have none, so
// Cmd+Z there still undoes the design (T-025-shortcuts-skip-text-entry-only).
const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** True when the key goes to a field whose own text undo should handle it. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  // jsdom doesn't implement isContentEditable, so the attribute check stands in for it there.
  return (
    target.isContentEditable ||
    target.closest("[contenteditable]:not([contenteditable='false'])") !== null
  );
}

/** "undo" or "redo" for the design shortcuts, or null for any other key. */
function shortcutFor(e: KeyboardEvent): "undo" | "redo" | null {
  if (e.altKey || !(e.metaKey || e.ctrlKey)) return null;
  const key = e.key.toLowerCase();
  if (key === "z") return e.shiftKey ? "redo" : "undo";
  if (key === "y" && e.ctrlKey && !e.metaKey && !e.shiftKey) return "redo";
  return null;
}

export function UndoRedo() {
  const canUndo = useStoreApi(useStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStoreApi(useStore.temporal, (s) => s.futureStates.length > 0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || isTextEntry(e.target)) return;
      const action = shortcutFor(e);
      if (!action) return;
      e.preventDefault();
      useStore.temporal.getState()[action]();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Undo"
        title="Undo (Cmd+Z or Ctrl+Z)"
        disabled={!canUndo}
        onClick={() => useStore.temporal.getState().undo()}
        className={BUTTON}
      >
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Redo"
        title="Redo (Shift+Cmd+Z or Ctrl+Y)"
        disabled={!canRedo}
        onClick={() => useStore.temporal.getState().redo()}
        className={BUTTON}
      >
        <Redo2 size={16} aria-hidden="true" />
      </button>
    </>
  );
}
