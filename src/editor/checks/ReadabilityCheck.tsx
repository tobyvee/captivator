"use client";

import { FastAverageColor } from "fast-average-color";
import { Check, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { Design } from "@/lib/design-schema";
import { checkDesign } from "@/lib/readability";
import { Notice } from "../controls/Notice";

const HEX = /^#[0-9a-f]{6}$/i;
const MAX_CACHED = 8; // photos are data URLs up to ~1 MB, so keep only the recent ones as keys

// Average colour per photo `src`, shared by every mount: a string once sampled, null if sampling failed.
const averages = new Map<string, string | null>();
const sampling = new Map<string, Promise<void>>();
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
      });
    sampling.set(src, job);
  }
  return job;
}

/** The photo's average colour, cached by `src`. Undefined until it's sampled, or if sampling fails. */
export function usePhotoAverage(src: string | undefined): string | undefined {
  const [, setSampled] = useState(0);

  useEffect(() => {
    if (!src || averages.has(src)) return;
    let live = true;
    void sample(src).then(() => {
      if (live) setSampled((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, [src]);

  return (src && averages.get(src)) || undefined;
}

/**
 * The design-wide readability line in the caption row under the preview. It only warns: nothing
 * here blocks editing. The status region stays mounted so a change of verdict is announced.
 */
export function ReadabilityCheck({ design }: { design: Design }) {
  const { background } = design;
  const photoAverage = usePhotoAverage(background.type === "image" ? background.src : undefined);
  const result = checkDesign(design, photoAverage);
  const [first, ...rest] = result.failures;

  return (
    <div role="status" className="flex justify-center">
      {result.status === "fail" ? (
        <Notice className="max-w-[420px] text-left" title={result.message}>
          <span className="text-xs leading-[1.45] text-[#92400E]">
            Needs {first.required}:1.{rest.length > 0 && ` ${rest.length} more to fix.`}
          </span>
        </Notice>
      ) : (
        <span
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
