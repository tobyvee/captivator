"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { useShallow } from "zustand/react/shallow";
import type { Design } from "@/lib/design-schema";
import { useStore } from "@/lib/store";

const HEX_INPUT = /^#?[0-9a-fA-F]{6}$/;
// Room for a pasted colour with a space either side; the text is trimmed before it is checked.
const HEX_MAX_LENGTH = 9;
const MAX_DESIGN_COLOURS = 8;
// Overflow values that give an element scrollbars.
const SCROLLS = /^(auto|scroll)$/;

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
  const labelId = `${autoId}-label`;
  const popoverId = `${autoId}-picker`;
  const rowId = `${autoId}-design`;
  const logoRowId = `${autoId}-logo`;

  const inDesign = useStore(useShallow((s) => designColours(s.design)));
  const fromLogo = useStore(useShallow((s) => cleanPalette(s.logoPalette)));

  const [open, setOpen] = useState(false);
  // The hex input's text while it has focus; null shows `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const current = value.toUpperCase();

  // Close on a press outside the swatch and popover. Focus is left where that press puts it.
  // A press on a scrollbar isn't one: Chrome sends it to the scroller, and the customer may be
  // dragging the inspector's scrollbar to bring the open popover into view.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!anchorRef.current?.contains(e.target as Node) && !isScrollbarPress(e)) setOpen(false);
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
      if (next !== current) onChange(next);
      setDraft(next);
    } else {
      setDraft(current);
    }
  }

  function pick(colour: string) {
    if (colour !== current) onChange(colour);
  }

  return (
    <div className="flex flex-col gap-2">
      <label id={labelId} htmlFor={inputId} className="text-[13px] font-semibold text-zinc-900">
        {label}
      </label>

      <div ref={anchorRef} className="relative flex items-center gap-2" onKeyDown={onAnchorKeyDown} onBlur={onAnchorBlur}>
        <button
          ref={swatchRef}
          type="button"
          aria-label="Open colour picker"
          aria-describedby={labelId}
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
            // cv-colour-picker: the taller hue strip and slider focus rings, in globals.css.
            className="cv-colour-picker absolute top-full left-0 z-30 mt-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg"
          >
            <HexColorPicker color={value} onChange={(c) => onChange(c.toUpperCase())} />
          </div>
        )}
        <input
          id={inputId}
          type="text"
          value={draft ?? current}
          maxLength={HEX_MAX_LENGTH}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          onFocus={() => setDraft(current)}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={() => {
            commitDraft();
            setDraft(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Escape" && open) {
              // Cancel the draft before the anchor's handler moves focus to the swatch, so the
              // blur that follows has nothing to commit. flushSync because that blur runs the
              // handler from the last commit, which still holds the draft.
              flushSync(() => setDraft(null));
            }
          }}
          className={`h-11 min-w-0 grow rounded-lg border border-zinc-300 bg-white px-2.5 font-mono text-sm text-zinc-900 ${FOCUS_RING}`}
        />
      </div>

      <SwatchRow id={rowId} title="In this design" colours={inDesign} current={current} onPick={pick} />
      {fromLogo.length > 0 && (
        <SwatchRow id={logoRowId} title="From your logo" colours={fromLogo} current={current} onPick={pick} />
      )}
    </div>
  );
}

function SwatchRow({
  id,
  title,
  colours,
  current,
  onPick,
}: {
  id: string;
  title: string;
  colours: string[];
  /** The field's value, uppercased. */
  current: string;
  onPick: (colour: string) => void;
}) {
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

/**
 * Whether a press landed on the target's own scrollbar. Only the root and elements whose overflow
 * is `auto` or `scroll` have scrollbars, which sit between the element's client area
 * (`clientLeft`/`clientTop` in from its border box, `clientWidth` × `clientHeight`) and its
 * border edge, so a press on one that overflows, outside its client area, is on a scrollbar.
 * The overflow-style check comes first because inline elements report a zero client area (and,
 * in Firefox, a non-zero scroll size), so geometry alone would count every press on them. This
 * holds for a scrollbar on either side (RTL puts it on the left) and on either axis. The root's
 * box moves with the page's scroll, but its scrollbars sit at the viewport's edge, so it's
 * measured from the viewport.
 */
function isScrollbarPress(e: PointerEvent): boolean {
  const el = e.target;
  if (!(el instanceof Element)) return false;
  const isRoot = el === el.ownerDocument.documentElement;
  if (!isRoot) {
    const { overflowX, overflowY } = getComputedStyle(el);
    if (!SCROLLS.test(overflowX) && !SCROLLS.test(overflowY)) return false;
  }
  if (el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth) return false;
  const box = isRoot ? { left: 0, top: 0 } : el.getBoundingClientRect();
  const x = e.clientX - box.left - el.clientLeft;
  const y = e.clientY - box.top - el.clientTop;
  return x < 0 || y < 0 || x >= el.clientWidth || y >= el.clientHeight;
}

function normalise(hex: string): string {
  return `#${hex.replace(/^#/, "").toUpperCase()}`;
}

/** Uppercase, valid `#RRGGBB` only, first occurrence kept. */
function cleanPalette(colours: string[]): string[] {
  return [...new Set(colours.filter((c) => HEX_INPUT.test(c)).map(normalise))];
}
