"use client";

import { useId } from "react";
import { MAX_TEXT_SIZE, MIN_TEXT_SIZE } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
import type { TextBlockSpec } from "@/lib/types";
import { ColourField } from "../controls/ColourField";
import { Segmented, type SegmentedOption } from "../controls/Segmented";
import { Slider } from "../controls/Slider";

type Role = TextBlockSpec["role"];

const MAX_TEXT = 120;

const STYLES: SegmentedOption<Role>[] = [
  { value: "heading", label: "Heading" },
  { value: "subheading", label: "Subheading" },
  { value: "body", label: "Body" },
];

const PRESET_SIZE: Record<Role, number> = { heading: 40, subheading: 20, body: 16 };

/** Text, style preset, size and colour for the text block `id`. Delete lives in the Inspector header. */
export function TextPanel({ id }: { id: string }) {
  // The Inspector unmounts this panel once the block is gone (T-008-inspector-keys-panels-by-block).
  const block = useStore((s) => {
    const b = s.design.blocks.find((b) => b.id === id);
    return b?.kind === "text" ? b : undefined;
  });
  const updateBlock = useStore((s) => s.updateBlock);
  const textId = useId();

  if (!block) return null;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={textId} className="text-[13px] font-semibold">
          Text
        </label>
        <textarea
          id={textId}
          rows={2}
          maxLength={MAX_TEXT}
          value={block.text}
          aria-describedby={`${textId}-count`}
          onChange={(e) => updateBlock(id, { text: e.currentTarget.value })}
          className="min-h-11 w-full resize-y rounded-lg border border-zinc-300 px-2.5 py-2 text-[15px] text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        <p id={`${textId}-count`} className="text-xs text-zinc-600">
          {block.text.length} of {MAX_TEXT} characters
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold" aria-hidden="true">
          Style
        </span>
        <Segmented
          label="Style"
          options={STYLES}
          value={block.role}
          onChange={(role) => updateBlock(id, { role, size: PRESET_SIZE[role] })}
        />
      </div>

      <Slider
        label="Size"
        value={block.size}
        min={MIN_TEXT_SIZE}
        max={MAX_TEXT_SIZE}
        unit=" px"
        onChange={(size) => updateBlock(id, { size })}
      />

      <ColourField label="Colour" value={block.colour} onChange={(colour) => updateBlock(id, { colour })} />

      <p className="text-xs leading-normal text-zinc-600">
        Want a two-colour headline? Add a second Text block and give it its own colour.
      </p>
    </div>
  );
}
