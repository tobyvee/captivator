"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { HexColorPicker } from "react-colorful";
import { useShallow } from "zustand/react/shallow";
import type { Design } from "@/lib/design-schema";
import { useStore } from "@/lib/store";

const HEX_INPUT = /^#?[0-9a-fA-F]{6}$/;
const MAX_DESIGN_COLOURS = 8;

const BLUE = "#2563EB";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]";

/**
 * The colours a design already uses, in the order they appear on the page (background, text
 * blocks, then the form), uppercased and deduplicated case-insensitively, at most 8.
 */
export function designColours(design: Design): string[] {
  const { background: bg, blocks, form } = design;
  const candidates = [
    ...(bg.type === "colour" ? [bg.colour] : bg.type === "gradient" ? [bg.from, bg.to] : [bg.backdrop]),
    ...blocks.flatMap((b) => (b.kind === "text" ? [b.colour] : [])),
    form.inputBg,
    form.inputText,
    form.terms.textColour,
    form.button.bg,
    form.button.fg,
  ];
  return [...new Set(candidates.map((c) => c.toUpperCase()))].slice(0, MAX_DESIGN_COLOURS);
}

type Props = {
  label: string;
  /** A `#RRGGBB` colour. */
  value: string;
  /** Called with an uppercase `#RRGGBB`, continuously while the picker is dragged. */
  onChange: (colour: string) => void;
  /** The hex input's id, for callers that point a `<label>` or description at it. */
  id?: string;
};

/** Swatch + picker popover, a hex input, and suggestion rows from the design and the logo. */
export function ColourField({ label, value, onChange, id }: Props) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-hex`;
  const popoverId = `${autoId}-picker`;
  const rowId = `${autoId}-design`;
  const logoRowId = `${autoId}-logo`;

  const inDesign = useStore(useShallow((s) => designColours(s.design)));
  const fromLogo = useStore(useShallow((s) => dedupe(s.logoPalette)));

  const [open, setOpen] = useState(false);
  // The hex input's text while it has focus; null shows `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on a press outside the swatch and popover. Focus is left where that press puts it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Opening moves focus into the picker so arrow keys work straight away.
  useEffect(() => {
    if (open) popoverRef.current?.querySelector<HTMLElement>('[role="slider"]')?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    swatchRef.current?.focus();
  }

  function onAnchorKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
    }
  }

  function onAnchorBlur(e: FocusEvent) {
    // Tabbing out of the swatch and picker closes the popover. A null relatedTarget is a click
    // on something unfocusable, which the pointerdown handler already judges.
    const next = e.relatedTarget as Node | null;
    if (open && next && !anchorRef.current?.contains(next)) setOpen(false);
  }

  function commitDraft() {
    if (draft === null) return;
    const text = draft.trim();
    if (HEX_INPUT.test(text)) {
      const next = normalise(text);
      if (next !== value.toUpperCase()) onChange(next);
      setDraft(next);
    } else {
      setDraft(value.toUpperCase());
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[13px] font-semibold text-zinc-900">
        {label}
      </label>

      <div ref={anchorRef} className="relative flex items-center gap-2" onKeyDown={onAnchorKeyDown} onBlur={onAnchorBlur}>
        <button
          ref={swatchRef}
          type="button"
          aria-label="Open colour picker"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={() => setOpen((o) => !o)}
          className={`size-11 shrink-0 cursor-pointer rounded-lg border border-zinc-300 ${FOCUS_RING}`}
          style={{ background: value }}
        />
        {open && (
          // Placed right after the swatch so Tab goes swatch, picker, hex input.
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={`${label} picker`}
            className={[
              "absolute top-full left-0 z-30 mt-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg",
              // Taller hue strip and focus rings on the picker's two sliders.
              "[&_.react-colorful__hue]:h-11",
              "[&_.react-colorful__interactive:focus-visible]:outline-2 [&_.react-colorful__interactive:focus-visible]:outline-offset-2 [&_.react-colorful__interactive:focus-visible]:outline-[#2563EB]",
            ].join(" ")}
          >
            <HexColorPicker color={value} onChange={(c) => onChange(c.toUpperCase())} />
          </div>
        )}
        <input
          id={inputId}
          type="text"
          value={draft ?? value.toUpperCase()}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          onFocus={() => setDraft(value.toUpperCase())}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={() => {
            commitDraft();
            setDraft(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          className={`h-11 min-w-0 grow rounded-lg border border-zinc-300 bg-white px-2.5 font-mono text-sm text-zinc-900 ${FOCUS_RING}`}
        />
      </div>

      <SwatchRow id={rowId} title="In this design" colours={inDesign} value={value} onPick={onChange} />
      {fromLogo.length > 0 && (
        <SwatchRow id={logoRowId} title="From your logo" colours={fromLogo} value={value} onPick={onChange} />
      )}
    </div>
  );
}

function SwatchRow({
  id,
  title,
  colours,
  value,
  onPick,
}: {
  id: string;
  title: string;
  colours: string[];
  value: string;
  onPick: (colour: string) => void;
}) {
  const current = value.toUpperCase();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-wrap items-center">
      <span id={id} className="mr-1 text-xs text-zinc-600">
        {title}
      </span>
      {colours.map((c) => {
        const selected = c === current;
        return (
          // 44px tap target around the canvas's 24px dot.
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={selected}
            onClick={() => onPick(c)}
            className={`flex size-11 cursor-pointer items-center justify-center rounded-full ${FOCUS_RING}`}
          >
            <span
              aria-hidden="true"
              className="block size-6 rounded-full"
              style={{ background: c, border: selected ? `2px solid ${BLUE}` : "1px solid #D4D4D8" }}
            />
          </button>
        );
      })}
    </div>
  );
}

function normalise(hex: string): string {
  return `#${hex.replace(/^#/, "").toUpperCase()}`;
}

/** Uppercase, valid `#RRGGBB` only, first occurrence kept. */
function dedupe(colours: string[]): string[] {
  return [...new Set(colours.filter((c) => HEX_INPUT.test(c)).map(normalise))];
}
