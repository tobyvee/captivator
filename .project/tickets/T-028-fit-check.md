---
title: "T-028: Small-phone fit check"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 8
estimate: 10
depends_on: [T-005, T-009]
touches:
  - src/lib/fit.ts
  - src/lib/fit.test.ts
  - src/editor/checks/useFitCheck.tsx
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
- [ ] The decision function warns above 600px and not at or below it (tests: 601 → true, 600 → false, 420 → false).
- [ ] Adding five text blocks to Sponsor shows the fit warning and the fold line; removing them clears it (spec checklist).
- [ ] The probe never appears visually or to screen readers, and doesn't intercept clicks.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-005: `SplashPage` with `compact` and `mode="preview"`.
- T-009: the `useFitCheck` stub and the UI that consumes it.

## Notes
- **From T-017:** the fit note uses the shared `src/editor/controls/Notice.tsx` ([`T-017-notice-shared-control.md`](../decisions/T-017-notice-shared-control.md)).
`ResizeObserver` measurement isn't unit-tested (spec); it's covered by the manual checklist (T-029).
