---
title: "T-016: Background panel: colour, gradient and photo upload"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 4
estimate: 15
depends_on: [T-008, T-010, T-011]
touches:
  - src/editor/panels/BackgroundPanel.tsx
  - src/editor/panels/PhotoAdjustments.tsx
  - src/editor/panels/UnsplashSearch.tsx
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, editor]
---
# T-016: Background panel: colour, gradient and photo upload

## Context
Build step 4 and brief item "upload a background image or choose a background colour" ([spec → Editor UI → Inspector panels → Background](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `BackgroundPanel` stub from T-008. The P0 part (colour and photo upload) is here, with gradient alongside. Fit, zoom, focus and darken come in T-017, and Unsplash search in T-032 (stretch), each through a stub this ticket creates. Canvas artboard: `DesktopPreview` (right column, "Background"). Decisions: [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md), [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md).

## Scope
- `BackgroundPanel()`:
  - A `Segmented` for Colour / Gradient / Photo. The selected tab defaults to the background's `type` and is kept in local state.
  - **Colour:** a `ColourField`. Choosing the tab converts the background to `{ type: "colour", colour }`, taking the gradient's `from` or the photo's `backdrop` when switching.
  - **Gradient:** `ColourField`s "From" and "To", plus three direction presets (`Segmented` with arrow icons; labels "Top to bottom", "Diagonal", "Left to right" → `down | diagonal | right`). Choosing the tab converts to `{ type: "gradient", from: current colour or "#0F2A44", to: "#0E5E6F", direction: "down" }`.
  - **Photo:**
    - `<UnsplashSearch/>` (stub) first, then "Upload your own": `ImageUpload kind="background"`.
    - If the background is already a photo, upload sets `{ ...bg, src, credit: undefined }`. Otherwise it creates `{ type: "image", src, fit: "fill", zoom: 1, focus: { x: 50, y: 50 }, backdrop: previous colour or "#111111", overlay: { from: "#000000", to: "#000000", opacity: 0.4 } }`.
    - Choosing the Photo tab without a photo shows the upload prompt and doesn't change the store.
    - When the background is a photo, show its credit line ("Photo by {name} on Unsplash") if it has one, then `<PhotoAdjustments/>`.
- `PhotoAdjustments.tsx` stub → T-017: `export function PhotoAdjustments() { return null; }`.
- `UnsplashSearch.tsx` stub → T-032: `export function UnsplashSearch() { return null; }`.
- **Out of scope:** fit, zoom, focus, backdrop and darken (T-017); Unsplash (T-031, T-032).

## Acceptance criteria
- [ ] Colour, gradient (both stops and all three directions) and an uploaded photo each show live in Mobile and Desktop preview (spec checklist: background image and colour).
- [ ] Switching tabs keeps a sensible colour, and never stores a photo background without a `src`.
- [ ] Uploading a 1600px+ photo stores a downscaled data URL (T-011 pipeline).
- [ ] All controls are labelled and keyboard-reachable, with at least 44px tap targets.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the stub, `Segmented`, and `updateBackground` via the store.
- T-010: `ColourField`.
- T-011: `ImageUpload` (`kind: "background"`, 1600px cap).

## Notes
- `updateBackground` replaces the whole background object. Build the full next object; the store drops anything that fails the schema.
- Canvas copy: "Fills the whole screen behind your content" (header, T-008), "Find a photo", "Upload your own".

## Decisions
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`T-006-photo-background-rendered-in-step-2.md`](../decisions/T-006-photo-background-rendered-in-step-2.md): Photo backgrounds render from build step 2, not step 4
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
