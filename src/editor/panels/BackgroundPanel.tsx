"use client";

import { ArrowDown, ArrowDownRight, ArrowRight } from "lucide-react";
import { useId, useState } from "react";
import { useStore } from "@/lib/store";
import type { BackgroundSpec, ImageBackground } from "@/lib/types";
import { profileHref, UNSPLASH_HOME } from "@/splash/Background";
import { ColourField } from "../controls/ColourField";
import { ImageUpload } from "../controls/ImageUpload";
import { Segmented, type SegmentedOption } from "../controls/Segmented";
import { PhotoAdjustments } from "./PhotoAdjustments";
import { UnsplashSearch } from "./UnsplashSearch";

type Tab = "colour" | "gradient" | "photo";
type Direction = Extract<BackgroundSpec, { type: "gradient" }>["direction"];

const TABS: SegmentedOption<Tab>[] = [
  { value: "colour", label: "Colour" },
  { value: "gradient", label: "Gradient" },
  { value: "photo", label: "Photo" },
];

const DIRECTIONS: SegmentedOption<Direction>[] = [
  { value: "down", label: "Top to bottom", icon: <ArrowDown size={16} aria-hidden="true" /> },
  { value: "diagonal", label: "Diagonal", icon: <ArrowDownRight size={16} aria-hidden="true" /> },
  { value: "right", label: "Left to right", icon: <ArrowRight size={16} aria-hidden="true" /> },
];

const GRADIENT_TO = "#0E5E6F";

const tabFor = (type: BackgroundSpec["type"]): Tab => (type === "image" ? "photo" : type);

/** The colour a background shows most of: its colour, a gradient's first stop, or a photo's backdrop. */
export function mainColour(bg: BackgroundSpec): string {
  switch (bg.type) {
    case "colour":
      return bg.colour;
    case "gradient":
      return bg.from;
    case "image":
      return bg.backdrop;
  }
}

/**
 * The background with a new photo. A photo keeps its fit, zoom, focus and overlay; anything else
 * becomes a fresh photo over its main colour. Unsplash (T-032) uses this too.
 */
export function withPhoto(bg: BackgroundSpec, src: string, credit?: ImageBackground["credit"]): ImageBackground {
  return bg.type === "image"
    ? { ...bg, src, credit }
    : {
        type: "image",
        src,
        credit,
        fit: "fill",
        zoom: 1,
        focus: { x: 50, y: 50 },
        backdrop: mainColour(bg),
        overlay: { from: "#000000", to: "#000000", opacity: 0.4 },
      };
}

/** Colour / Gradient / Photo settings for the pinned background. */
export function BackgroundPanel() {
  const bg = useStore((s) => s.design.background);
  const updateBackground = useStore((s) => s.updateBackground);

  // The tab follows the background's type, including changes from undo or a template switch.
  // Photo can be chosen without a photo yet, so the tab is local state rather than derived.
  const [tab, setTab] = useState<Tab>(() => tabFor(bg.type));
  const [shownType, setShownType] = useState(bg.type);
  if (bg.type !== shownType) {
    setShownType(bg.type);
    setTab(tabFor(bg.type));
  }

  function chooseTab(next: Tab) {
    setTab(next);
    if (next === "colour" && bg.type !== "colour") {
      updateBackground({ type: "colour", colour: mainColour(bg) });
    } else if (next === "gradient" && bg.type !== "gradient") {
      updateBackground({ type: "gradient", from: mainColour(bg), to: GRADIENT_TO, direction: "down" });
    }
    // Photo changes nothing until a photo is chosen: the schema has no photo without a `src`.
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <Segmented label="Background type" options={TABS} value={tab} onChange={chooseTab} />

      {tab === "colour" && bg.type === "colour" && (
        <ColourField label="Colour" value={bg.colour} onChange={(colour) => updateBackground({ ...bg, colour })} />
      )}

      {tab === "gradient" && bg.type === "gradient" && (
        <>
          <ColourField label="From" value={bg.from} onChange={(from) => updateBackground({ ...bg, from })} />
          <ColourField label="To" value={bg.to} onChange={(to) => updateBackground({ ...bg, to })} />
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-zinc-900">Direction</span>
            <Segmented
              label="Gradient direction"
              options={DIRECTIONS}
              value={bg.direction}
              onChange={(direction) => updateBackground({ ...bg, direction })}
            />
          </div>
        </>
      )}

      {tab === "photo" && (
        <PhotoTab
          photo={bg.type === "image" ? bg : null}
          // Read the background when the shrink finishes, not when the file was picked, so an
          // undo or template switch in between isn't overwritten.
          onUploaded={(src) => updateBackground(withPhoto(useStore.getState().design.background, src))}
        />
      )}
    </div>
  );
}

function PhotoTab({ photo, onUploaded }: { photo: ImageBackground | null; onUploaded: (src: string) => void }) {
  const promptId = useId();
  return (
    <>
      <div className="flex flex-col gap-2">
        <UnsplashSearch />
        {!photo && (
          <p id={promptId} className="text-xs leading-snug text-zinc-600">
            Upload a photo to fill the screen behind your content.
          </p>
        )}
        <ImageUpload
          kind="background"
          label="Upload your own"
          describedBy={photo ? undefined : promptId}
          onUploaded={onUploaded}
        />
        {photo?.credit && <PhotoCredit credit={photo.credit} />}
      </div>
      {photo && <PhotoAdjustments />}
    </>
  );
}

function PhotoCredit({ credit }: { credit: NonNullable<ImageBackground["credit"]> }) {
  const name = credit.name.trim();
  const href = profileHref(credit.profileUrl);
  return (
    <p className="text-xs text-zinc-600">
      Photo by{" "}
      {href && name ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
          {name}
        </a>
      ) : (
        name || "an Unsplash photographer"
      )}{" "}
      on{" "}
      <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer" className="underline">
        Unsplash
      </a>
    </p>
  );
}
