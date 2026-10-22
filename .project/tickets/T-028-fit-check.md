---
title: "T-028: Small-phone fit check"
type: ticket
project: captivator
status: done
priority: P1
milestone: 8
estimate: 10
depends_on: [T-005, T-009]
touches:
  - src/lib/fit.ts
  - src/lib/fit.test.ts
  - src/editor/checks/useFitCheck.tsx
  - src/editor/checks/useFitCheck.test.tsx
  - src/editor/frames/PhoneFrame.tsx
cut_rank: 5
updated: 2026-10-23
tags: [project, captivator, ticket, lib, editor]
---
# T-028: Small-phone fit check

## Context
Build step 8, "fit check" ([spec → Checks → Fit](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Unit tests* → `fit`; PRD *Fit check*). This is cut order item 5. It replaces the `useFitCheck` stub from T-009. `PreviewStage` already draws the fold line and the amber note from `tooTall`, so this ticket only measures. Canvas artboard: `Main` (dashed "Small-phone fold" line and "Too tall for small phones" note).

## Scope
- **`src/lib/fit.ts`:** `FIT_WIDTH = 375`, `FOLD_HEIGHT = 600`, and `isTooTall(height: number): boolean` (`height > 600`).
- **`useFitCheck(design)`:**
  - Returns `{ tooTall, height, probe }`, where `probe` is a hidden container: `aria-hidden`, `position: absolute; left: -10000px; top: 0; width: 375px; visibility: hidden; pointer-events: none`.
  - The probe holds `<SplashPage design={design} screen="landing" mode="preview" compact />`, with no `inFrame`.
  - Measure the SplashPage root's `scrollHeight` with a `ResizeObserver`. That re-measures on design changes and image loads. Without `inFrame` and outside export, the root has no min-height, so this is the content height, not a frame (review finding 15).
- `fit.test.ts` (node environment).
- **Out of scope:** the fold line and note UI (T-009, `PhoneFrame`/`PreviewStage`).

## Acceptance criteria
- [x] The decision function warns above 600px and not at or below it (tests: 601 → true, 600 → false, 420 → false).
- [x] Adding five text blocks to Sponsor shows the fit warning and the fold line; removing them clears it (spec checklist). *Unit-tested up to layout; the real-browser check is on T-029's checklist ([`T-028-manual-fit-check-in-t029.md`](../decisions/T-028-manual-fit-check-in-t029.md)).*
- [x] The probe never appears visually or to screen readers, and doesn't intercept clicks.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-005: `SplashPage` with `compact` and `mode="preview"`.
- T-009: the `useFitCheck` stub and the UI that consumes it.

## Outcome
- **Built:** `src/lib/fit.ts` (`FIT_WIDTH` 375, `FOLD_HEIGHT` 600, `isTooTall` strictly above 600) and `useFitCheck`, which replaces T-009's stub. It renders the landing page compact in preview mode, without `inFrame`, in a hidden, inert, zero-height probe 375px wide, and a `ResizeObserver` on SplashPage's root reads its `scrollHeight`. `PreviewStage` already drew the fold line and note from `tooTall`. Where `ResizeObserver` is missing, nothing warns. 762 tests pass; `tsc` and lint are clean.
- **Review:** approved with two should-fixes, both fixed in `0a3c7a2`. The hook's test now wraps the real `SplashPage`, so a change to its root tag fails three tests (mutation-checked) ([`T-028-fit-hook-test-renders-real-splash.md`](../decisions/T-028-fit-hook-test-renders-real-splash.md)). `PhoneFrame` draws the line at `FOLD_HEIGHT` instead of its own 600 ([`T-028-phone-frame-shares-fold-height.md`](../decisions/T-028-phone-frame-shares-fold-height.md)).
- **Sponsor at 599px:** stable, since nothing on it wraps; accepted, with checks on T-029 ([`T-028-sponsor-one-pixel-inside-fold.md`](../decisions/T-028-sponsor-one-pixel-inside-fold.md)).
- **Security:** not a trust-boundary ticket; the wave audit covers it.

## Notes
- **Review nit left as it is:** `fit.test.ts` pins `FIT_WIDTH` and `FOLD_HEIGHT` to the spec's numbers, close to restating them; kept so a change to either is deliberate.
- **For later tickets:** the probe observes SplashPage's top-level `<div>`, so that root must stay a `<div>` (`T-028-probe-clips-to-zero-height.md`).
- **From T-017:** the fit note uses the shared `src/editor/controls/Notice.tsx` ([`T-017-notice-shared-control.md`](../decisions/T-017-notice-shared-control.md)).
`ResizeObserver` measurement isn't unit-tested (spec); it's covered by the manual checklist (T-029).

## Decisions
- [`T-028-fit-hook-test-file-added.md`](../decisions/T-028-fit-hook-test-file-added.md): adds `useFitCheck.test.tsx`
- [`T-028-probe-clips-to-zero-height.md`](../decisions/T-028-probe-clips-to-zero-height.md): the probe is zero-height with hidden overflow, and observes SplashPage's root `<div>`
- [`T-028-fit-hook-test-renders-real-splash.md`](../decisions/T-028-fit-hook-test-renders-real-splash.md): the hook's test wraps the real SplashPage
- [`T-028-phone-frame-shares-fold-height.md`](../decisions/T-028-phone-frame-shares-fold-height.md): `PhoneFrame` uses `FOLD_HEIGHT`
- [`T-028-sponsor-one-pixel-inside-fold.md`](../decisions/T-028-sponsor-one-pixel-inside-fold.md): Sponsor 1px inside the fold is accepted
- [`T-028-manual-fit-check-in-t029.md`](../decisions/T-028-manual-fit-check-in-t029.md): the five-text-block browser check moves to T-029
