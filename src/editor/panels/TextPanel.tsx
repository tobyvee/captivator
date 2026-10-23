"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useId } from "react";
import { formatRatio } from "@/lib/contrast";
import { MAX_TEXT_SIZE, MIN_TEXT_SIZE } from "@/lib/design-schema";
import { rateText } from "@/lib/readability";
import { useStore } from "@/lib/store";
import type { TextBlockSpec } from "@/lib/types";
import { WEIGHT } from "@/splash/blocks/TextBlock";
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

// The canvas's green "Easy to read" box, and the amber notice style (T-009-notices-share-amber-style).
const TONE = {
  pass: { box: "border-[#BBF7D0] bg-[#F0FDF4]", icon: "text-[#166534]", title: "text-[#14532D]", detail: "text-[#166534]" },
  warn: { box: "border-[#FDE68A] bg-[#FFFBEB]", icon: "text-[#92400E]", title: "text-[#78350F]", detail: "text-[#92400E]" },
};

function ContrastLine({ block }: { block: TextBlockSpec }) {
  const background = useStore((s) => s.design.background);
  const result = rateText(block.colour, block.size, WEIGHT[block.role], background);
  const ends = background.type === "gradient" ? " Checked at both ends of the gradient." : "";
  const pass = result.kind === "pass";
  const tone = TONE[pass ? "pass" : "warn"];
  const Icon = pass ? Check : TriangleAlert;

  return (
    <div
      className={[
        "flex gap-2.5 rounded-lg border p-3",
        tone.box,
      ].join(" ")}
    >
      <Icon size={18} aria-hidden="true" className={`shrink-0 ${tone.icon}`} />
      <div className="flex flex-col gap-0.5">
        {/* Only the verdict is live, so it's announced when it flips, not on every drag step. */}
        <span role="status" className={`text-[13px] font-semibold ${tone.title}`}>
          {result.kind === "photo" ? "Check readability over your photo" : pass ? "Easy to read" : "Hard to read"}
        </span>
        {result.kind !== "photo" && (
          <span className={`text-xs leading-[1.45] ${tone.detail}`}>
            {result.kind === "pass"
              ? `${formatRatio(result.ratio)} against the background.${ends}`
              : `${formatRatio(result.ratio)}, needs ${result.required}:1.`}
          </span>
        )}
      </div>
    </div>
  );
}

/** Text, style preset, size, colour and a contrast line for the text block `id`. Delete lives in the Inspector header. */
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

      <ContrastLine block={block} />

      <p className="text-xs leading-normal text-zinc-600">
        Want a two-colour headline? Add a second Text block and give it its own colour.
      </p>
    </div>
  );
}
