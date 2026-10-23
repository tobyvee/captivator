"use client";

import { FastAverageColor } from "fast-average-color";
import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { readableTextColour, worstRatio } from "@/lib/contrast";
import type { Design } from "@/lib/design-schema";
import { checkDesign, type ReadabilityFailure } from "@/lib/readability";
import { useStore, type FormPatch } from "@/lib/store";
import { Notice } from "../controls/Notice";

const HEX = /^#[0-9a-f]{6}$/i;
const MAX_CACHED = 8; // photos are data URLs up to ~1 MB, so keep only the recent ones as keys

// Average colour per photo `src`, shared by every mount: a string once sampled, null if sampling failed.
const averages = new Map<string, string | null>();
const sampling = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
let fac: FastAverageColor | undefined;

function sample(src: string): Promise<void> {
  let job = sampling.get(src);
  if (!job) {
    fac ??= new FastAverageColor();
    job = fac
      .getColorAsync(src, { algorithm: "simple", silent: true })
      .then(
        (c) => (c.error || !HEX.test(c.hex) ? null : c.hex.toUpperCase()),
        () => null,
      )
      .then((hex) => {
        averages.set(src, hex);
        sampling.delete(src);
        if (averages.size > MAX_CACHED) averages.delete(averages.keys().next().value!);
        listeners.forEach((notify) => notify());
      });
    sampling.set(src, job);
  }
  return job;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => void listeners.delete(notify);
}

/** The photo's average colour, cached by `src`. Undefined until it's sampled, or if sampling fails. */
export function usePhotoAverage(src: string | undefined): string | undefined {
  useEffect(() => {
    if (src && !averages.has(src)) void sample(src);
  }, [src]);

  return useSyncExternalStore(
    subscribe,
    () => (src && averages.get(src)) || undefined,
    () => undefined,
  );
}

type Fix = { label: string } & ({ kind: "block"; id: string; colour: string } | { kind: "form"; patch: FormPatch });

/**
 * The one-tap Fix for a failure: `readableTextColour` (near-black, white or black) picked against
 * the colours `checkDesign` rated the text on. Null when that colour wouldn't read better than the
 * current one, which happens on pages with several colours where no pick reads on all of them, and
 * for the inputs' edge, which has no text to recolour (T-035-failure-carries-colours.md,
 * T-027-input-edge-contrast.md).
 */
function fixFor(failure: ReadabilityFailure): Fix | null {
  const { label, target, against } = failure;
  if (target.kind === "inputs" && label === "Fields") return null;
  const colour = readableTextColour(against);
  if (worstRatio(colour, against) <= failure.ratio) return null;

  switch (target.kind) {
    case "block":
      return { label, kind: "block", id: target.id, colour };
    case "terms":
      return { label, kind: "form", patch: { terms: { textColour: colour } } };
    case "button":
      return { label, kind: "form", patch: { button: { fg: colour } } };
    case "inputs":
      return { label, kind: "form", patch: { inputText: colour } };
  }
}

/**
 * The design-wide readability line in the caption row under the preview. It only warns: nothing
 * here blocks editing. Only the verdict is live, so dragging a colour while it fails isn't announced
 * at every step (T-027-readability-verdict-live-only.md).
 */
export function ReadabilityCheck({ design }: { design: Design }) {
  const { background } = design;
  const photoAverage = usePhotoAverage(background.type === "image" ? background.src : undefined);
  const result = checkDesign(design, photoAverage);
  const [first, ...rest] = result.failures;
  // The first failure that has a Fix, which may not be the one the Notice's title names
  // (T-035-fix-first-fixable-failure.md).
  const fix = result.failures.map((f) => fixFor(f)).find((f) => f !== null);
  const updateBlock = useStore((s) => s.updateBlock);
  const updateForm = useStore((s) => s.updateForm);

  // One store action, so one undo step.
  const applyFix = () => {
    if (fix?.kind === "block") updateBlock(fix.id, { colour: fix.colour });
    else if (fix) updateForm(fix.patch);
  };

  // In the caption row, the short passing line sits beside the caption, as on the canvas; the
  // failure Notice takes the row's full width, so it wraps under the caption (T-037-failure-notice-under-caption.md).
  return (
    <div className={`flex justify-center${result.status === "fail" ? " basis-full" : ""}`}>
      <span role="status" className="sr-only">
        {result.status === "fail" ? `${first.label} is hard to read` : result.message}
      </span>
      {result.status === "fail" ? (
        <Notice className="w-full max-w-[420px] text-left" title={result.message}>
          <span className="text-xs leading-[1.45] text-[#92400E]">
            Needs {first.required}:1.{rest.length > 0 && ` ${rest.length} more to fix.`}
          </span>
          {fix && (
            <button
              type="button"
              // A double-click's second click would apply the next failure's Fix, which renders in the
              // same spot and folds into the same undo step. Keyboard clicks have detail 0.
              onClick={(e) => {
                if (e.detail <= 1) applyFix();
              }}
              className="-ml-2 flex min-h-11 items-center self-start rounded-md px-2 text-xs font-semibold text-[#78350F] underline hover:text-[#451A03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Fix {fix.label}
            </button>
          )}
        </Notice>
      ) : (
        <span
          aria-hidden="true"
          className={`flex items-center gap-1.5 ${result.status === "ok" ? "text-[#166534]" : "text-[#92400E]"}`}
        >
          {result.status === "ok" ? (
            <Check size={14} strokeWidth={2.4} aria-hidden="true" className="shrink-0" />
          ) : (
            <TriangleAlert size={14} strokeWidth={2.2} aria-hidden="true" className="shrink-0" />
          )}
          {result.message}
        </span>
      )}
    </div>
  );
}
