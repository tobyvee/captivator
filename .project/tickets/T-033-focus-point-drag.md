---
title: "T-033: Focus-point drag dot"
type: ticket
project: captivator
status: done
priority: P2
milestone: 4
estimate: 10
depends_on: [T-017]
touches:
  - src/editor/panels/FocusGrid.tsx
  - src/editor/panels/PhotoAdjustments.test.tsx
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
- [x] Dragging moves the focus live in the preview; one drag is one undo step (T-025's debounce).
- [x] Arrow keys move the dot and announce the new position.
- [x] Presets still work.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-017: `FocusGrid.tsx` and its `value`/`onChange` API.

## Outcome
- **Built:** FocusGrid's dot is now a 44px `<button>` at the exact focus point, labelled "Focus point, {x}% across, {y}% down". It drags with pointer capture (whole percentages, clamped), moves 5% per arrow key with a hidden status announcement, and sits over the 3×3 presets, which still work. The per-square marker is gone and FocusGrid is a client component ([`T-033-focus-grid-client-dot-replaces-marker.md`](../decisions/T-033-focus-grid-client-dot-replaces-marker.md), superseding T-017's). A 2-second drag through the store is one undo step (mutation-checked by the review). 822 tests pass; `tsc` and lint are clean.
- **Review:** approved with four should-fixes, all fixed in `89e32ea` with mutation-checked tests: an off-centre grab no longer jumps the dot, modified arrows (Alt+Left is Back) are left to the browser, the description tells keyboard users about the arrow keys, and the cancel and other-pointer paths are tested. The `ARROWS` typing nit is fixed too.
- **Milestone 4 review:** ready to close. Its one minor finding, the dot's tap target clipped to about 33px at the box's edges, is fixed in `3b35555` ([`T-033-dot-tap-target-unclipped.md`](../decisions/T-033-dot-tap-target-unclipped.md)).
- **Security:** not a trust-boundary ticket; the wave audit covers it.

## Notes
- **Still open from milestone 4:** the spec's "fade direction" for the darken overlay (three buttons on the canvas) was deferred in [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md) pending a schema change (`overlay.direction`, a v3 migration). No decision has settled it; it's a question for the user.
- **Undo:** a drag is one step through the store's leading-edge debounce, so a pause of 400ms or more mid-drag starts a second step.
- **Tests:** jsdom has no `setPointerCapture`; drag tests stub it on `HTMLElement.prototype`.
- **Review nit left as it is:** `stubTrack` finds the track with `closest("div")`, which still assumes the track is the dot's nearest `div`.
- **From T-017:** add the drag dot at the exact focus point in `FocusGrid` and drop the per-square dot; extend `PhotoAdjustments.test.tsx` ([`T-017-focus-grid-photo-and-marker.md`](../decisions/T-017-focus-grid-photo-and-marker.md)).

## Decisions
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`T-033-drag-dot-inset-track.md`](../decisions/T-033-drag-dot-inset-track.md): the dot travels an 11px-inset track and drags only from the dot
- [`T-033-arrow-key-announcement.md`](../decisions/T-033-arrow-key-announcement.md): arrow-key moves are announced; FocusGrid is a client component
- [`T-033-help-line-and-tests.md`](../decisions/T-033-help-line-and-tests.md): FocusGrid renders the help line; tests extend `PhotoAdjustments.test.tsx`
- [`T-033-focus-grid-client-dot-replaces-marker.md`](../decisions/T-033-focus-grid-client-dot-replaces-marker.md): supersedes T-017's FocusGrid decision
- [`T-033-dot-tap-target-unclipped.md`](../decisions/T-033-dot-tap-target-unclipped.md): the box doesn't clip the dot's 44px tap target
- [`T-017-focus-grid-photo-and-marker.md`](../decisions/T-017-focus-grid-photo-and-marker.md): the props, group, labels and pressed square (superseded)
