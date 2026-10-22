---
title: "T-017: Photo fit, zoom, focus presets and darken overlay"
type: ticket
project: captivator
status: done
priority: P1
milestone: 4
estimate: 20
depends_on: [T-016]
touches:
  - src/editor/panels/PhotoAdjustments.tsx
  - src/editor/panels/FocusGrid.tsx
  - src/editor/panels/PhotoAdjustments.test.tsx
  - src/editor/controls/Notice.tsx
  - src/editor/PreviewStage.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-017: Photo fit, zoom, focus presets and darken overlay

## Context
Build step 4: Fill/Fit, Zoom, 3×3 focus and the darken overlay ([spec → Editor UI → Inspector panels → Background → Photo](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `PhotoAdjustments` stub from T-016. The focus drag dot is stretch (T-033, cut 2), so `FocusGrid` takes a value/onChange API that T-033 can extend. Canvas artboard: `DesktopPreview` (Photo size, Zoom, Focus point, Darken for readability). Decisions: [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md), [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md).

## Scope
- `PhotoAdjustments()` renders only when the background is a photo, and dispatches `updateBackground({ ...bg, … })`:
  - **Photo size:** `Segmented` "Fill screen" / "Show whole photo" (`fit: "fill" | "fit"`), with the help text "Show whole photo leaves space around it; you then pick the colour of that space."
  - **Backdrop:** `ColourField` "Colour around the photo" (fit only).
  - **Zoom:** `Slider` 100–200% (fill only) → `zoom = value / 100`.
  - **Focus point:** `<FocusGrid value={bg.focus} onChange={focus => …} />` with the help text "Tap the part of the photo that must stay visible on every screen."
  - **Darken for readability:** `Slider` 0–85% → `overlay.opacity = value / 100`. If `overlay` is null, create `{ from: "#000000", to: "#000000", opacity }`.
  - **Size note** (data-URL photos only): "Photo is {n} KB of your budget" (≈ `src.length * 0.75 / 1024`) with "Guests load this before they are online. We shrink photos for you; a busy photo still costs more than a gradient."
- `FocusGrid.tsx`: `FocusGrid({ value: { x: number; y: number }; onChange(v): void })`. A 3×3 grid of `<button>`s mapping to x, y ∈ {0, 50, 100}, `aria-label` "Focus top left" … "Focus bottom right", with `aria-pressed` on the nearest preset.
- **Out of scope:** the drag dot (T-033); fade direction (deferred; see decision); Unsplash (T-032).

## Acceptance criteria
- [x] Fill/Show whole switches `object-fit` in the preview; the backdrop colour shows around a "whole" photo.
- [x] Zoom 100–200% scales the photo around the focus point; the zoom slider is hidden or disabled for "Show whole photo".
- [x] Each focus preset moves `object-position` and `transform-origin`, and is visible in both Mobile and Desktop. *The panel writes `focus`; the shared renderer (T-006, tested) draws it in both frames. Not yet seen in a browser.*
- [x] The darken slider changes the overlay opacity live, from 0 to 85%.
- [x] One slider drag is one undo step once T-025 lands (no extra work here). *Nothing to build here; T-025's debounce covers it.*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-016: the `PhotoAdjustments` stub and the photo branch of the Background panel. `ColourField`, `Slider` and `Segmented` come through T-016's dependencies.

## Outcome
- **Built:** the photo adjustments under the Background panel's Photo tab: Fill screen / Show whole photo, Zoom 100–200% (fill only), Colour around the photo (whole only), a 3×3 `FocusGrid` over the photo, Darken 0–85%, and the photo's budget note. 552 tests pass; `tsc` and lint are clean.
- **Review:** approved with two should-fixes, both fixed (`545567f`). The budget note counts the base64 length the export ships ([`T-017-budget-note-counts-base64.md`](../decisions/T-017-budget-note-counts-base64.md)). The amber `Notice` is a shared control used by the preview stage and this panel ([`T-017-notice-shared-control.md`](../decisions/T-017-notice-shared-control.md), [`T-017-photo-controls-with-shared-notice.md`](../decisions/T-017-photo-controls-with-shared-notice.md)).
- **Security:** not a trust-boundary ticket; no audit run.

## Notes
- **Review nits left as they are:** the Photo size help isn't tied to its group (`Segmented` has no `describedBy` prop). The grid's white focus ring and lines fade on a light photo; a two-tone ring would fix it. The 1 KB floor has no test.
- The canvas also shows three "Fade direction" buttons. The schema's overlay has no direction field, so they're deferred pending a user decision on a schema change. Don't add them.

## Decisions
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`T-006-photo-background-rendered-in-step-2.md`](../decisions/T-006-photo-background-rendered-in-step-2.md): Photo backgrounds render from build step 2, not step 4
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`T-017-panel-test-file-added.md`](../decisions/T-017-panel-test-file-added.md): adds `PhotoAdjustments.test.tsx`
- [`T-017-focus-grid-photo-and-marker.md`](../decisions/T-017-focus-grid-photo-and-marker.md): FocusGrid's photo, labels, rounding and marker
- [`T-017-photo-controls-visibility-and-zero-darken.md`](../decisions/T-017-photo-controls-visibility-and-zero-darken.md): control visibility and 0% darken (superseded)
- [`T-017-photo-controls-with-shared-notice.md`](../decisions/T-017-photo-controls-with-shared-notice.md): the same rules, with the shared Notice
- [`T-017-budget-note-counts-base64.md`](../decisions/T-017-budget-note-counts-base64.md): the note counts base64 bytes
- [`T-017-notice-shared-control.md`](../decisions/T-017-notice-shared-control.md): one shared amber `Notice`
