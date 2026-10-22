"use client";

import { FastAverageColor } from "fast-average-color";
import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import type { Design } from "@/lib/design-schema";
import { checkDesign } from "@/lib/readability";
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
