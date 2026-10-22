"use client";

import { useId, useState } from "react";
import { useStore } from "@/lib/store";
import type { ImageBlockSpec } from "@/lib/types";
import { ImageUpload } from "../controls/ImageUpload";
import { Segmented, type SegmentedOption } from "../controls/Segmented";

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
  const storedAlt = block?.alt ?? "";

  // The store refuses an empty alt (T-004-store-rejects-invalid-designs), so the input keeps a
  // local draft. It follows the stored alt when that changes from outside, e.g. undo.
  const [draft, setDraft] = useState(storedAlt);
  const [syncedAlt, setSyncedAlt] = useState(storedAlt);
  if (storedAlt !== syncedAlt) {
    setSyncedAlt(storedAlt);
    setDraft(storedAlt);
  }

  if (!block) return null;

  const altMissing = draft.trim() === "";

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
          aria-describedby={`${altId}-hint`}
          onChange={(e) => {
            const alt = e.currentTarget.value;
            setDraft(alt);
            if (alt.trim() !== "") updateBlock(id, { alt });
          }}
          className={[
            "min-h-11 w-full rounded-lg border px-2.5 text-[15px] text-zinc-900",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
            altMissing ? "border-red-600" : "border-zinc-300",
          ].join(" ")}
        />
        <p id={`${altId}-hint`} className={["text-xs", altMissing ? "text-red-700" : "text-zinc-600"].join(" ")}>
          {altMissing ? "Describe the image" : "Read aloud to guests who use a screen reader."}
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
