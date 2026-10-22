"use client";

import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import { useStore } from "@/lib/store";
import type { ImageBackground } from "@/lib/types";
import { ColourField } from "../controls/ColourField";
import { Segmented, type SegmentedOption } from "../controls/Segmented";
import { Slider } from "../controls/Slider";
import { FocusGrid } from "./FocusGrid";

const FITS: SegmentedOption<ImageBackground["fit"]>[] = [
  { value: "fill", label: "Fill screen" },
  { value: "fit", label: "Show whole photo" },
];

// A new overlay is a plain black wash; templates may store other stops, which are kept.
const BLACK = "#000000";

/** The size a data URL's bytes take, in KB: base64 stores 3 bytes in every 4 characters. */
const photoKb = (src: string) => Math.max(1, Math.round((src.length * 0.75) / 1024));

/** Photo size, zoom, backdrop, focus point and darken overlay for a photo background. */
export function PhotoAdjustments() {
  const bg = useStore((s) => s.design.background);
  const updateBackground = useStore((s) => s.updateBackground);
  const focusHelpId = useId();

  if (bg.type !== "image") return null;

  const update = (patch: Partial<ImageBackground>) => updateBackground({ ...bg, ...patch });
  const darken = Math.round((bg.overlay?.opacity ?? 0) * 100);

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-zinc-900" aria-hidden="true">
          Photo size
        </span>
        <Segmented label="Photo size" options={FITS} value={bg.fit} onChange={(fit) => update({ fit })} />
        <p className="text-xs leading-[1.45] text-zinc-600">
          Show whole photo leaves space around it; you then pick the colour of that space.
        </p>
        {bg.fit === "fill" ? (
          <Slider
            label="Zoom"
            value={Math.round(bg.zoom * 100)}
            min={100}
            max={200}
            unit="%"
            onChange={(value) => update({ zoom: value / 100 })}
          />
        ) : (
          <ColourField
            label="Colour around the photo"
            value={bg.backdrop}
            onChange={(backdrop) => update({ backdrop })}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-zinc-900" aria-hidden="true">
          Focus point
        </span>
        <p id={focusHelpId} className="text-xs leading-[1.45] text-zinc-600">
          Tap the part of the photo that must stay visible on every screen.
        </p>
        <FocusGrid value={bg.focus} src={bg.src} describedBy={focusHelpId} onChange={(focus) => update({ focus })} />
      </div>

      <Slider
        label="Darken for readability"
        value={darken}
        min={0}
        max={85}
        unit="%"
        onChange={(value) => {
          const opacity = value / 100;
          update({ overlay: bg.overlay ? { ...bg.overlay, opacity } : { from: BLACK, to: BLACK, opacity } });
        }}
      />

      {bg.src.startsWith("data:") && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
          <TriangleAlert size={18} strokeWidth={2.2} aria-hidden="true" className="mt-px shrink-0 text-[#92400E]" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-[#78350F]">
              Photo is {photoKb(bg.src)} KB of your budget
            </span>
            <span className="text-xs leading-[1.45] text-[#92400E]">
              Guests load this before they are online. We shrink photos for you; a busy photo still costs more than a
              gradient.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
