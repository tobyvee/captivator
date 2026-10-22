"use client";

import { FastAverageColor } from "fast-average-color";
import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { backgroundColours, readableTextColour } from "@/lib/contrast";
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

type Fix = { kind: "block"; id: string; colour: string } | { kind: "form"; patch: FormPatch };

/**
 * The one-tap Fix for a failure: the text colour that reads best on what the text sits on, measured
 * against the same colours `checkDesign` uses, a fitted photo's backdrop included
 * (T-027-fitted-photo-checks-backdrop.md). Null when there is nothing to change: the inputs' edge
 * has no text to recolour (T-027-input-edge-contrast.md), and a colour that is already the best
 * pick would make a button that does nothing (T-035-fix-colour-and-when-shown.md).
 */
function fixFor(design: Design, failure: ReadabilityFailure, photoAverage: string | undefined): Fix | null {
  const { background: bg, form } = design;
  const page = backgroundColours(bg, photoAverage);
  if (bg.type === "image" && bg.fit === "fit" && photoAverage) page.push(...backgroundColours(bg));
  const { target } = failure;

  let current: string;
  let colour: string;
  let fix: Fix;
  switch (target.kind) {
    case "block": {
      const block = design.blocks.find((b) => b.id === target.id);
      if (block?.kind !== "text") return null;
      current = block.colour;
      colour = readableTextColour(page);
      fix = { kind: "block", id: block.id, colour };
      break;
    }
    case "terms":
      current = form.terms.textColour;
      colour = readableTextColour(page);
      fix = { kind: "form", patch: { terms: { textColour: colour } } };
      break;
    case "button":
      current = form.button.fg;
      colour = readableTextColour(form.button.variant === "outline" ? page : form.button.bg);
      fix = { kind: "form", patch: { button: { fg: colour } } };
      break;
    case "inputs":
      // "Fields" (the edge) and "Field text" share this target; only the text can be fixed.
      if (failure.label === "Fields") return null;
      current = form.inputText;
      colour = readableTextColour(form.inputBg);
      fix = { kind: "form", patch: { inputText: colour } };
      break;
  }
  return colour.toUpperCase() === current.toUpperCase() ? null : fix;
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
  const fix = first ? fixFor(design, first, photoAverage) : null;
  const updateBlock = useStore((s) => s.updateBlock);
  const updateForm = useStore((s) => s.updateForm);

  // One store action, so one undo step.
  const applyFix = () => {
    if (fix?.kind === "block") updateBlock(fix.id, { colour: fix.colour });
    else if (fix) updateForm(fix.patch);
  };

  return (
    <div className="flex justify-center">
      <span role="status" className="sr-only">
        {result.status === "fail" ? `${first.label} is hard to read` : result.message}
      </span>
      {result.status === "fail" ? (
        <Notice className="max-w-[420px] text-left" title={result.message}>
          <span className="text-xs leading-[1.45] text-[#92400E]">
            Needs {first.required}:1.{rest.length > 0 && ` ${rest.length} more to fix.`}
          </span>
          {fix && (
            <button
              type="button"
              onClick={applyFix}
              aria-label={`Fix ${first.label}`}
              className="-ml-2 flex min-h-11 items-center self-start rounded-md px-2 text-xs font-semibold text-[#78350F] underline hover:text-[#451A03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Fix
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
