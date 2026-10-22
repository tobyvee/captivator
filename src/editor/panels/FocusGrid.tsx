"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type FocusPoint = { x: number; y: number };

type Props = {
  /** The focus point in percent, 0–100 on each axis. */
  value: FocusPoint;
  onChange: (value: FocusPoint) => void;
  /** The photo drawn behind the grid, so each square shows the part of the photo it picks. */
  src?: string;
  /** The id of the help text that describes the grid. */
  describedBy?: string;
};

const STOPS = [0, 50, 100] as const;
const ROWS = ["top", "middle", "bottom"] as const;
const COLUMNS = ["left", "centre", "right"] as const;

/** How far one arrow key press moves the dot, in percent. */
const KEY_STEP = 5;
const ARROWS: Record<string, FocusPoint> = {
  ArrowLeft: { x: -KEY_STEP, y: 0 },
  ArrowRight: { x: KEY_STEP, y: 0 },
  ArrowUp: { x: 0, y: -KEY_STEP },
  ArrowDown: { x: 0, y: KEY_STEP },
};

// "Focus top left" … "Focus bottom right"; the middle square is "Focus centre", not "middle centre".
function presetLabel(row: number, column: number): string {
  if (row === 1 && column === 1) return "Focus centre";
  return `Focus ${ROWS[row]} ${COLUMNS[column]}`;
}

/** The preset (0, 50 or 100) nearest a focus coordinate. */
const nearest = (v: number) => Math.min(100, Math.max(0, Math.round(v / 50) * 50));

/** A whole percentage from 0 to 100. */
const percent = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

const position = ({ x, y }: FocusPoint) => `Focus point, ${x}% across, ${y}% down`;

/**
 * A 3×3 grid of presets over the photo, with a dot at the exact focus point on top. Each square
 * sets the focus to 0, 50 or 100% on each axis, and the square nearest the current focus is
 * pressed. The dot drags for fine control and moves 5% per arrow key.
 */
export function FocusGrid({ value, onChange, src, describedBy }: Props) {
  const pressedX = nearest(value.x);
  const pressedY = nearest(value.y);
  const helpId = useId();
  // The dot's travel area: the box inset by the dot's radius, so a dot at 0% or 100% stays whole.
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);
  // Read out after an arrow key moves the dot; empty otherwise, so a drag isn't narrated.
  const [announcement, setAnnouncement] = useState("");

  const move = (next: FocusPoint) => {
    if (next.x !== value.x || next.y !== value.y) onChange(next);
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = e.pointerId;
    setAnnouncement("");
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const rect = track.current?.getBoundingClientRect();
    if (dragging.current !== e.pointerId || !rect || rect.width === 0 || rect.height === 0) return;
    move({
      x: percent(((e.clientX - rect.left) / rect.width) * 100),
      y: percent(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const endDrag = (e: PointerEvent<HTMLButtonElement>) => {
    if (dragging.current === e.pointerId) dragging.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = ARROWS[e.key];
    if (!step) return;
    e.preventDefault(); // the page would scroll
    const next = { x: percent(value.x + step.x), y: percent(value.y + step.y) };
    move(next);
    setAnnouncement(position(next));
  };

  return (
    <>
      <div className="relative h-[150px] overflow-hidden rounded-lg bg-[#0B1F2E]">
        {/* The same photo as the preview, so screen readers skip it. */}
        {src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div
          role="group"
          aria-label="Focus point"
          aria-describedby={describedBy}
          className="absolute inset-0 grid grid-cols-3 grid-rows-3"
        >
          {STOPS.map((y, row) =>
            STOPS.map((x, column) => (
              <button
                key={`${x}-${y}`}
                type="button"
                aria-label={presetLabel(row, column)}
                aria-pressed={x === pressedX && y === pressedY}
                onClick={() => {
                  setAnnouncement("");
                  onChange({ x, y });
                }}
                className={[
                  "min-h-11 border-white/35 bg-transparent hover:bg-white/15",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
                  column < 2 ? "border-r" : "",
                  row < 2 ? "border-b" : "",
                ].join(" ")}
              />
            )),
          )}
        </div>
        <div ref={track} className="pointer-events-none absolute inset-[11px]">
          <button
            type="button"
            aria-label={position(value)}
            aria-describedby={helpId}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={onKeyDown}
            style={{ left: `${value.x}%`, top: `${value.y}%` }}
            className={[
              "pointer-events-auto absolute flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none",
              "cursor-grab items-center justify-center rounded-full active:cursor-grabbing",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="size-[18px] rounded-full border-2 border-white bg-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.35)]"
            />
          </button>
        </div>
        <span role="status" className="sr-only">
          {announcement}
        </span>
      </div>
      <p id={helpId} className="text-xs leading-[1.45] text-zinc-600">
        Drag the dot for fine control, or tap a square.
      </p>
    </>
  );
}
