"use client";

import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
  MousePointerClick,
  Paintbrush,
  TextCursorInput,
  Type,
} from "lucide-react";
import { type JSX, type ReactNode, useId, useRef } from "react";
import { flushSync } from "react-dom";
import { backgroundColours, bestTextColour } from "@/lib/contrast";
import { type Block, type Design, FIELD_SPEC, MAX_IMAGES } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
import type { BackgroundSpec, Selection, TextBlockSpec } from "@/lib/types";
import { ANGLE } from "@/splash/Background";
import { ImageUpload } from "./controls/ImageUpload";
import { TermsSwitch } from "./controls/TermsSwitch";

const TEXT_NAMES: Record<TextBlockSpec["role"], string> = {
  heading: "Heading",
  subheading: "Subheading",
  body: "Text",
};

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

function blockName(block: Block): string {
  return block.kind === "text" ? TEXT_NAMES[block.role] : "Image";
}

function blockSummary(block: Block): string {
  if (block.kind === "image") return block.alt;
  // Cut by code points so an emoji or other astral character is never split in half.
  return block.text.trim() ? Array.from(block.text).slice(0, 30).join("") : "Empty";
}

function backgroundSummary(bg: BackgroundSpec): string {
  switch (bg.type) {
    case "colour":
      return `Colour, ${bg.colour.toUpperCase()}`;
    case "gradient":
      return `Gradient, ${bg.from.toUpperCase()} to ${bg.to.toUpperCase()}`;
    case "image":
      return bg.overlay && bg.overlay.opacity > 0 ? "Photo, darkened" : "Photo";
  }
}

function fieldsSummary(fields: Design["form"]["fields"]): string {
  return fields.length ? fields.map((f) => FIELD_SPEC[f].placeholder).join(", ") : "None, guests just tap Connect";
}

function isSelected(selection: Selection, kind: Selection["kind"], id?: string): boolean {
  return selection.kind === kind && (id === undefined || selection.id === id);
}

function Swatch({ background }: { background: string }) {
  return (
    <span aria-hidden="true" className="size-[22px] shrink-0 rounded-md border border-zinc-300" style={{ background }} />
  );
}

function BackgroundSwatch({ bg }: { bg: BackgroundSpec }): JSX.Element {
  switch (bg.type) {
    case "colour":
      return <Swatch background={bg.colour} />;
    case "gradient":
      return <Swatch background={`linear-gradient(${ANGLE[bg.direction]}, ${bg.from}, ${bg.to})`} />;
    case "image":
      return (
        <img src={bg.src} alt="" className="size-[22px] shrink-0 rounded-md border border-zinc-300 object-cover" />
      );
    default: {
      const unreachable: never = bg;
      return unreachable;
    }
  }
}

type RowProps = {
  icon: LucideIcon;
  name: string;
  summary: string;
  selected: boolean;
  onSelect: () => void;
  /** Pinned rows (background and form) are grey; blocks are white. */
  pinned?: boolean;
  /** Shown inside the row button, after the text (a swatch). */
  swatch?: ReactNode;
  /** Sibling controls beside the row button (move buttons, the Terms switch), never nested in it. */
  controls?: ReactNode;
  /** Set on the summary so sibling controls can point `aria-describedby` at it. */
  summaryId?: string;
  /** The block's id on its select button, so focus can be moved to the row. */
  blockId?: string;
};

/** One row: a select button filling the row, with any controls as its siblings. */
function Row({ icon: Icon, name, summary, selected, onSelect, pinned, swatch, controls, summaryId, blockId }: RowProps) {
  return (
    <div
      className={[
        "flex min-h-12 items-center rounded-lg border-[1.5px]",
        selected ? "border-blue-600 bg-blue-50" : pinned ? "border-zinc-200 bg-zinc-50" : "border-transparent bg-white",
        controls ? "pr-0.5" : "",
      ].join(" ")}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        data-block-id={blockId}
        onClick={onSelect}
        className={`flex min-h-11 min-w-0 flex-1 items-center gap-2.5 self-stretch rounded-[7px] px-2.5 py-1.5 text-left text-zinc-900 ${FOCUS_RING}`}
      >
        <Icon size={18} aria-hidden="true" className={selected ? "shrink-0 text-blue-600" : "shrink-0 text-zinc-600"} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span data-row-name className="text-[13px] font-semibold">
            {name}
          </span>
          <span id={summaryId} className={["truncate text-xs", selected ? "text-blue-800" : "text-zinc-600"].join(" ")}>
            {summary}
          </span>
        </span>
        {swatch}
      </button>
      {controls}
    </div>
  );
}

const MOVE_BUTTON = [
  "flex size-11 shrink-0 items-center justify-center rounded-lg text-zinc-600",
  "hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent",
  FOCUS_RING,
].join(" ");

type BlockRowProps = {
  block: Block;
  selected: boolean;
  first: boolean;
  last: boolean;
  move: (id: string, dir: -1 | 1) => void;
  register: (key: string) => (el: HTMLButtonElement | null) => void;
};

function BlockRow({ block, selected, first, last, move, register }: BlockRowProps) {
  const setSelection = useStore((s) => s.setSelection);
  // Two blocks can share a name (Sponsor's two images), so the move buttons are described by the
  // row's summary to tell them apart.
  const summaryId = useId();
  const name = blockName(block);
  return (
    <Row
      icon={block.kind === "text" ? Type : ImageIcon}
      name={name}
      summary={blockSummary(block)}
      summaryId={summaryId}
      blockId={block.id}
      selected={selected}
      onSelect={() => setSelection({ kind: "block", id: block.id })}
      controls={
        <>
          <button
            ref={register(`${block.id}:-1`)}
            type="button"
            aria-label={`Move ${name} up`}
            aria-describedby={summaryId}
            disabled={first}
            onClick={() => move(block.id, -1)}
            className={MOVE_BUTTON}
          >
            <ChevronUp size={16} aria-hidden="true" />
          </button>
          <button
            ref={register(`${block.id}:1`)}
            type="button"
            aria-label={`Move ${name} down`}
            aria-describedby={summaryId}
            disabled={last}
            onClick={() => move(block.id, 1)}
            className={MOVE_BUTTON}
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </>
      }
    />
  );
}

function BlockRows({ blocks, selection }: { blocks: Design["blocks"]; selection: Selection }) {
  const moveBlock = useStore((s) => s.moveBlock);
  const moveButtons = useRef(new Map<string, HTMLButtonElement>());

  function move(id: string, dir: -1 | 1) {
    // React refocuses the clicked button after its row moves in the DOM, but not once the move
    // disables it at the new end. Render the move first, then hand focus to the other button.
    flushSync(() => moveBlock(id, dir));
    if (moveButtons.current.get(`${id}:${dir}`)?.disabled) moveButtons.current.get(`${id}:${-dir}`)?.focus();
  }

  const register = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) moveButtons.current.set(key, el);
    else moveButtons.current.delete(key);
  };

  return blocks.map((block, i) => (
    <BlockRow
      key={block.id}
      block={block}
      selected={isSelected(selection, "block", block.id)}
      first={i === 0}
      last={i === blocks.length - 1}
      move={move}
      register={register}
    />
  ));
}

function AddButtons({ imageCount }: { imageCount: number }) {
  const addBlock = useStore((s) => s.addBlock);
  const setLogoPalette = useStore((s) => s.setLogoPalette);
  const atLimit = imageCount >= MAX_IMAGES;
  const container = useRef<HTMLDivElement>(null);

  function addText() {
    const { background } = useStore.getState().design;
    addBlock({
      kind: "text",
      text: "New text",
      role: "body",
      colour: bestTextColour(backgroundColours(background)),
      size: 16,
    });
  }

  function addImage(src: string) {
    // Read the count at upload time: the design may have changed while the image was shrinking.
    const images = useStore.getState().design.blocks.filter((b) => b.kind === "image").length;
    // Render the add now: reaching the limit disables the file input, which drops its focus.
    const id = flushSync(() =>
      addBlock({ kind: "image", src, alt: images === 0 ? "Logo" : "Sponsor logo", size: "md" }),
    );
    if (id === null || images + 1 < MAX_IMAGES) return;
    // Move focus to the new block's row (already selected), unless the customer has put it
    // somewhere else while the image was shrinking.
    const here = container.current;
    const active = document.activeElement;
    if (!here || (active && active !== document.body && !here.contains(active))) return;
    Array.from(here.closest("aside")?.querySelectorAll<HTMLButtonElement>("button[data-block-id]") ?? [])
      .find((b) => b.dataset.blockId === id)
      ?.focus();
  }

  return (
    <div ref={container} className="mt-2.5 flex flex-col gap-0.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={addText}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-lg border bg-white px-3 text-[13px] font-medium text-zinc-900 hover:bg-zinc-50 border-dashed border-zinc-400 ${FOCUS_RING}`}
        >
          + Text
        </button>
        <ImageUpload
          kind="image"
          label="+ Image"
          onUploaded={addImage}
          onPalette={setLogoPalette}
          disabled={atLimit}
          describedBy={atLimit ? "image-limit" : undefined}
          // Restyles the upload's label as a dashed add button, like "+ Text".
          className="min-w-0 flex-1 [&>label]:border-dashed [&>label]:border-zinc-400"
        />
      </div>
      {atLimit && (
        <p id="image-limit" className="text-xs text-zinc-600">
          {MAX_IMAGES} of {MAX_IMAGES} images used.
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <div aria-hidden="true" className="my-1.5 h-px bg-zinc-200" />;
}

/** The left-hand column: the pinned background, the reorderable blocks, then the pinned form. */
export function BlockList() {
  const design = useStore((s) => s.design);
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const { background, blocks, form } = design;
  const termsOn = form.terms.mode === "checkbox";
  const imageCount = blocks.filter((b) => b.kind === "image").length;
  // A stale block selection shows the background in the inspector, so highlight it here too.
  const shown: Selection =
    selection.kind === "block" && !blocks.some((b) => b.id === selection.id) ? { kind: "background" } : selection;

  return (
    <aside aria-label="Blocks" className="flex flex-1 flex-col gap-1.5 p-4">
      <h2 className="mb-1.5 text-xs font-semibold tracking-[0.06em] text-zinc-600 uppercase">Blocks</h2>

      <Row
        icon={Paintbrush}
        name="Background"
        summary={backgroundSummary(background)}
        selected={isSelected(shown, "background")}
        onSelect={() => setSelection({ kind: "background" })}
        pinned
        swatch={<BackgroundSwatch bg={background} />}
      />

      <Divider />

      <BlockRows blocks={blocks} selection={shown} />
      <AddButtons imageCount={imageCount} />

      <Divider />

      <Row
        icon={TextCursorInput}
        name="Fields"
        summary={fieldsSummary(form.fields)}
        selected={isSelected(shown, "fields")}
        onSelect={() => setSelection({ kind: "fields" })}
        pinned
      />
      <Row
        icon={FileText}
        name="Terms"
        summary={termsOn ? "Optional, shown" : "Off"}
        selected={isSelected(shown, "terms")}
        onSelect={() => setSelection({ kind: "terms" })}
        pinned
        controls={<TermsSwitch />}
      />
      <Row
        icon={MousePointerClick}
        name="Connect button"
        summary={form.button.label}
        selected={isSelected(shown, "button")}
        onSelect={() => setSelection({ kind: "button" })}
        pinned
        swatch={<Swatch background={form.button.bg} />}
      />

      <p className="mt-auto rounded-lg bg-zinc-100 px-3 py-2.5 text-xs leading-normal text-zinc-700">
        Tip: tap anything in the preview to edit it.
      </p>
    </aside>
  );
}
