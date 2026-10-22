---
title: "T-033: Focus-point drag dot"
type: ticket
project: captivator
status: todo
priority: P2
milestone: 4
estimate: 10
depends_on: [T-017]
touches:
  - src/editor/panels/FocusGrid.tsx
cut_rank: 2
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-033: Focus-point drag dot

## Context
Stretch from step 4 ("3×3 focus grid (drag dot is stretch)"), cut order item 2: "focus-point drag (keep presets)" ([spec → Editor UI → Inspector panels → Background](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This extends `FocusGrid` from T-017 without changing its props. Canvas artboard: `DesktopPreview` ("Drag the dot for fine control, or tap a square.").

## Scope
- In `FocusGrid({ value, onChange })`, add a dot drawn at `value.x%`/`value.y%` over the grid:
  - Pointer drag with `setPointerCapture` calls `onChange` with clamped, rounded percentages.
  - The dot is a focusable `<button>` with `aria-label="Focus point, {x}% across, {y}% down"`; arrow keys move it by 5.
  - Keep the 3×3 presets working.
- Add the help line "Drag the dot for fine control, or tap a square."
- **Out of scope:** any other photo control.

## Acceptance criteria
- [ ] Dragging moves the focus live in the preview; one drag is one undo step (T-025's debounce).
- [ ] Arrow keys move the dot and announce the new position.
- [ ] Presets still work.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-017: `FocusGrid.tsx` and its `value`/`onChange` API.

## Notes
- **From T-017:** add the drag dot at the exact focus point in `FocusGrid` and drop the per-square dot; extend `PhotoAdjustments.test.tsx` ([`T-017-focus-grid-photo-and-marker.md`](../decisions/T-017-focus-grid-photo-and-marker.md)).

## Decisions
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
