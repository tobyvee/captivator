"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { buildExportHtml, downloadHtml, ExportError, exportFileName, PAGE_BUDGET } from "@/lib/export";
import { useStore } from "@/lib/store";

/** How long a within-budget toast stays up. Warnings and failures stay until dismissed. */
export const TOAST_MS = 6000;

type Toast = { tone: "ok" | "warn" | "error"; text: string };

const BUDGET_KB = Math.round(PAGE_BUDGET / 1024);
const kb = (bytes: number) => Math.round(bytes / 1024);

// Shown when the failure isn't an ExportError, so there's no customer-facing message to pass on.
const MSG_UNEXPECTED = "Something went wrong. Try again.";

/** "We couldn't…" reads as "Export failed: we couldn't…". The message is plain text, never markup. */
function failureText(err: unknown): string {
  const msg = err instanceof ExportError && err.message ? err.message : MSG_UNEXPECTED;
  return `Export failed: ${msg.charAt(0).toLowerCase()}${msg.slice(1)}`;
}

const TONES: Record<Toast["tone"], string> = {
  ok: "border-zinc-200 bg-white text-zinc-900",
  warn: "border-[#FDE68A] bg-[#FFFBEB] text-[#78350F]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
};

export function ExportButton() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  // The only double-export guard: aria-disabled leaves the button clickable.
  const running = useRef(false);

  // A within-budget toast hides itself; a new toast restarts the timer.
  useEffect(() => {
    if (toast?.tone !== "ok") return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  async function onExport() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setToast(null);
    // The design and name as they are at the click: that's what the customer asked to export.
    const { design, name } = useStore.getState();
    try {
      const { html, bytes, overBudget, reencoded } = await buildExportHtml(design, name);
      downloadHtml(html, name);
      const file = exportFileName(name);
      setToast(
        overBudget
          ? {
              tone: "warn",
              text: `Downloaded ${file}: ${kb(bytes)} KB, over the ${BUDGET_KB} KB budget. Guests on slow WiFi may wait; try a simpler photo.`,
            }
          : {
              tone: "ok",
              text: `Downloaded ${file}: ${kb(bytes)} KB of ${BUDGET_KB} KB${reencoded ? ". Photo shrunk to fit." : ""}`,
            },
      );
    } catch (err) {
      // An ExportError is expected and already explained to the customer; anything else is a bug.
      if (!(err instanceof ExportError)) console.error(err);
      setToast({ tone: "error", text: failureText(err) });
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      {/* aria-disabled, not disabled, so keyboard focus stays on the button while it runs
          (T-024-aria-disabled-keeps-focus); `running` ignores clicks meanwhile. */}
      <button
        type="button"
        aria-disabled={busy}
        onClick={onExport}
        className="min-h-11 rounded-lg bg-[#18181B] px-4 text-[13px] font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-[#18181B]"
      >
        {busy ? "Exporting…" : "Export HTML"}
      </button>

      <div className="pointer-events-none fixed right-4 bottom-4 left-4 z-50 flex justify-end sm:left-auto">
        <div
          className={
            toast
              ? `pointer-events-auto flex max-w-sm items-start gap-1 rounded-lg border py-1 pl-3.5 pr-1 shadow-lg ${TONES[toast.tone]}`
              : undefined
          }
        >
          {/* Always mounted and holding only the text, so a new toast is announced without
              "Dismiss, button" (T-024-toast-status-holds-only-text). */}
          <p role="status" className="min-w-0 py-2.5 text-[13px] leading-[1.45] empty:py-0">
            {toast?.text}
          </p>
          {toast && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setToast(null)}
              className="flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
