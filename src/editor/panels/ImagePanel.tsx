"use client";

import { useId } from "react";
import { useStore } from "@/lib/store";
import type { ImageBlockSpec } from "@/lib/types";
import { ImageUpload } from "../controls/ImageUpload";
import { Segmented, type SegmentedOption } from "../controls/Segmented";
import { useRequiredDraft } from "../controls/useRequiredDraft";

const SIZES: SegmentedOption<ImageBlockSpec["size"]>[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

/** Replace upload, alt text and size for the image block `id`. Remove lives in the Inspector header. */
export function ImagePanel({ id }: { id: string }) {
  // The Inspector unmounts this panel once the block is gone (T-008-inspector-keys-panels-by-block).
  const block = useStore((s) => {
    const b = s.design.blocks.find((b) => b.id === id);
    return b?.kind === "image" ? b : undefined;
  });
  const updateBlock = useStore((s) => s.updateBlock);
  const setLogoPalette = useStore((s) => s.setLogoPalette);
  const altId = useId();
  // The store refuses an empty alt, so the input edits a draft that follows outside changes.
  const {
    draft,
    missing: altMissing,
    onChange: onAltChange,
  } = useRequiredDraft(block?.alt ?? "", (alt) => updateBlock(id, { alt }));

  if (!block) return null;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <div className="flex h-28 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 p-2">
          {/* A duplicate of the image in the preview, so screen readers skip it. */}
          <img src={block.src} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <ImageUpload
          kind="image"
          label="Replace image"
          onUploaded={(src) => updateBlock(id, { src })}
          onPalette={setLogoPalette}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={altId} className="text-[13px] font-semibold">
          Alt text
        </label>
        <input
          id={altId}
          type="text"
          value={draft}
          required
          aria-invalid={altMissing || undefined}
          aria-describedby={altMissing ? `${altId}-hint ${altId}-error` : `${altId}-hint`}
          onChange={(e) => onAltChange(e.currentTarget.value)}
          className={[
            "min-h-11 w-full rounded-lg border px-2.5 text-[15px] text-zinc-900",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
            altMissing ? "border-red-600" : "border-zinc-300",
          ].join(" ")}
        />
        <p id={`${altId}-hint`} className="text-xs text-zinc-600">
          Read aloud to guests who use a screen reader.
        </p>
        {/* Always mounted, so the error is announced as the field empties, not only on focus. */}
        <p id={`${altId}-error`} role="alert" className="text-xs text-red-700 empty:-mt-1.5">
          {altMissing ? "Describe the image" : null}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold" aria-hidden="true">
          Size
        </span>
        <Segmented label="Size" options={SIZES} value={block.size} onChange={(size) => updateBlock(id, { size })} />
      </div>
    </div>
  );
}
