---
title: "T-016: Background panel: colour, gradient and photo upload"
type: ticket
project: captivator
status: done
priority: P0
milestone: 4
estimate: 15
depends_on: [T-008, T-010, T-011]
touches:
  - src/editor/panels/BackgroundPanel.tsx
  - src/editor/panels/PhotoAdjustments.tsx
  - src/editor/panels/UnsplashSearch.tsx
  - src/editor/panels/BackgroundPanel.test.tsx
  - src/editor/editor.test.tsx
  - src/splash/Background.tsx
cut_rank:
updated: 2026-10-23
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
- [x] Colour, gradient (both stops and all three directions) and an uploaded photo each show live in Mobile and Desktop preview (spec checklist: background image and colour).
- [x] Switching tabs keeps a sensible colour, and never stores a photo background without a `src`.
- [x] Uploading a 1600px+ photo stores a downscaled data URL (T-011 pipeline). *The panel calls `processUpload(file, "background")` (tested); the real downscale runs only in a browser and is checked in T-029.*
- [x] All controls are labelled and keyboard-reachable, with at least 44px tap targets.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the stub, `Segmented`, and `updateBackground` via the store.
- T-010: `ColourField`.
- T-011: `ImageUpload` (`kind: "background"`, 1600px cap).

## Notes
- **Review nits left as they are:** the visible "Direction" label isn't tied to its group, which has its own `aria-label="Gradient direction"` (wiring it needs an `aria-labelledby` prop on `Segmented`). The tab resync could be one state field instead of a render-phase `setState`; the current version matches its decision.
- **Gradient direction labels** may wrap inside their buttons in the 320px inspector; not yet seen in a browser.
- `updateBackground` replaces the whole background object. Build the full next object; the store drops anything that fails the schema.
- Canvas copy: "Fills the whole screen behind your content" (header, T-008), "Find a photo", "Upload your own".

## Outcome
- **Built:** the Background panel's Colour / Gradient / Photo tabs. The colour carries across tabs, choosing Photo stores nothing until a photo is uploaded, and an Unsplash credit shows with referral links. `PhotoAdjustments` and `UnsplashSearch` are stubs for T-017 and T-032. 458 tests pass; `tsc` and lint are clean.
- **Review:** approved with should-fixes, all fixed (`ff13190`). An upload now applies to the background as it is when the shrink finishes, through an exported `withPhoto` that T-032 reuses ([`T-016-with-photo-helper.md`](../decisions/T-016-with-photo-helper.md)). The credit link uses the splash renderer's `profileHref` instead of a copy ([`T-016-credit-href-shared-with-splash.md`](../decisions/T-016-credit-href-shared-with-splash.md)). Tests were added for photo to gradient, an upload on a gradient, and Photo left for a new type.
- **Inspector test:** the stub-text assertion in `editor.test.tsx` was dropped on this branch ([`general-inspector-test-leaves-panels-to-their-tests.md`](../decisions/general-inspector-test-leaves-panels-to-their-tests.md)).
- **Audits:** exporting the credit helpers touched `src/splash/Background.tsx`, so both ran. The splash audit passed with all 168 renders byte-identical; the security audit found nothing.

## Decisions
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`T-006-photo-background-rendered-in-step-2.md`](../decisions/T-006-photo-background-rendered-in-step-2.md): Photo backgrounds render from build step 2, not step 4
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-016-photo-upload-split-from-adjustments.md`](../decisions/T-016-photo-upload-split-from-adjustments.md): Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`T-016-main-colour-carries-across-tabs.md`](../decisions/T-016-main-colour-carries-across-tabs.md): one main colour feeds every tab conversion
- [`T-016-tab-follows-background-type.md`](../decisions/T-016-tab-follows-background-type.md): the tab follows the stored type
- [`T-016-panel-test-file-added.md`](../decisions/T-016-panel-test-file-added.md): adds `BackgroundPanel.test.tsx`
- [`T-016-with-photo-helper.md`](../decisions/T-016-with-photo-helper.md): one exported `withPhoto`, applied to the current background
- [`T-016-credit-href-shared-with-splash.md`](../decisions/T-016-credit-href-shared-with-splash.md): the panel's credit link uses the splash renderer's `profileHref`
- [`general-inspector-test-leaves-panels-to-their-tests.md`](../decisions/general-inspector-test-leaves-panels-to-their-tests.md): the Inspector tests leave panel bodies to their own tests
