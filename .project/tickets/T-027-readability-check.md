---
title: "T-027: Readability check under the preview"
type: ticket
project: captivator
status: done
priority: P1
milestone: 8
estimate: 15
depends_on: [T-003, T-009]
touches:
  - src/lib/readability.ts
  - src/lib/readability.test.ts
  - src/editor/checks/ReadabilityCheck.tsx
  - src/editor/checks/ReadabilityCheck.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, lib, editor]
---
# T-027: Readability check under the preview

## Context
Build step 8, "contrast check" ([spec → Checks → Contrast](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md)). This replaces the `ReadabilityCheck` stub from T-009. It isn't in the cut order. The design-wide check lives in a new pure `readability.ts`, so `contrast.ts` (T-003) isn't edited again. Canvas artboard: `Main` ("All text is readable" under the frame). Decisions: [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md), [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md), [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md), [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md).

## Scope
- **`src/lib/readability.ts`:** `checkDesign(design: Design, photoAverage?: string): ReadabilityResult` (types in Notes). It checks, in this order:
  - Every text block against `backgroundColours(bg, photoAverage)`, worst case, at `requiredRatio(size, weight by role)`.
  - The terms label (14px/400) when terms are on.
  - The Connect label: `fg` on `bg` when solid, `fg` on the page background when outline.
  - Input text (16px/400) on `inputBg` when there are fields.
  - The inputs' edge: `inputBg` against the page background, worst case, at 3:1, when there are fields. The message is "Fields: {ratio} on the background" ([`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md)).
  - **Message:** the first failure as "{label}: {ratio} on the background" ("on the button" or "on the field" for those two). With no failures: "All text is readable", or "Check readability over your photo" (`status: "approximate"`) on photo backgrounds.
- **`ReadabilityCheck({ design })`:**
  - Gets the photo's average colour with fast-average-color (`getColorAsync(src, { algorithm: "simple" })`), cached by `src` in a module-level `Map`; undefined until it resolves or if it fails.
  - Renders one `role="status"` line: green tick for `ok`, amber for `approximate`, red-amber warning for `fail`.
- `readability.test.ts` (node environment).
- **Out of scope:** the one-tap Fix (T-035, stretch); per-panel contrast lines (T-013, T-020).

## Acceptance criteria
- [x] Blank's design reports "All text is readable" (test).
- [x] White text on a white background reports "Heading: 1.0:1 on the background" (spec checklist; test).
- [x] A gradient uses the worse stop (test).
- [x] A passing photo design reports `approximate` with "Check readability over your photo" (test).
- [x] An outline button checks `fg` against the page background (test).
- [x] Each failure carries a `target` that T-035 can act on (test one per kind).
- [x] The check warns but never blocks editing.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: `backgroundColours`, `worstRatio`, `contrastRatio`, `requiredRatio`, `formatRatio`.
- T-009: the `ReadabilityCheck` stub and its place under the frame.

## Outcome
- **Built:** `src/lib/readability.ts` (`checkDesign` with the ticket's result types) and `ReadabilityCheck` in the caption row under the preview. It samples a photo's average colour once per `src` with fast-average-color, caching up to 8 photos. A pass shows the canvas's green "All text is readable", a photo design that passes shows an amber "Check readability over your photo", and a failure shows the shared amber `Notice` with the ratio and what it needs. 578 tests pass; `tsc` and lint are clean.
- **Review:** approved with three should-fixes, all fixed in `6da959f`. Only the verdict is live, so a colour drag that keeps failing isn't announced at every step ([`T-027-readability-verdict-live-only.md`](../decisions/T-027-readability-verdict-live-only.md)). A fitted photo is also checked against its backdrop ([`T-027-fitted-photo-checks-backdrop.md`](../decisions/T-027-fitted-photo-checks-backdrop.md)). The failure tests now prove that a failed or tainted sample is ignored and cached. The review's `useSyncExternalStore` nit was taken too: the photo-average hook reads the cache through it.
- **Security:** not a trust-boundary ticket; no audit run.

## Notes
- **Review nits left as they are:** `readability.ts` repeats the form's sizes and weights (14/400, 16/700, 16/400) from `src/splash/Form.tsx`; a ticket that owns `Form.tsx` could export them, as `WEIGHT` was. The photo cache evicts the oldest sampled photo, not the least recently used.
- **From T-017:** warnings use the shared `src/editor/controls/Notice.tsx` ([`T-017-notice-shared-control.md`](../decisions/T-017-notice-shared-control.md)).
- **From T-013:** import the role weights from `@/splash/blocks/TextBlock` (`WEIGHT` is exported; [`T-013-role-weights-shared-with-splash.md`](../decisions/T-013-role-weights-shared-with-splash.md)). The Text panel shows no ratio over a photo ([`T-013-photo-line-never-rates.md`](../decisions/T-013-photo-line-never-rates.md)), so this line is where a photo design's failure shows. If the photo average is cached, the panel could reuse it later.
```ts
export type ReadabilityTarget =
  | { kind: "block"; id: string } | { kind: "terms" } | { kind: "button" } | { kind: "inputs" };
export type ReadabilityFailure = { label: string; ratio: number; required: number; target: ReadabilityTarget };
export type ReadabilityResult = { status: "ok" | "approximate" | "fail"; message: string; failures: ReadabilityFailure[] };
```

- **Labels:**
  - Text blocks by role: "Heading", "Subheading", "Text". Add " 2", " 3" for repeats of the same role.
  - "Terms checkbox", "Connect button", "Field text".
- Weights by role: 800 / 500 / 400. The Connect label is 16px/700, which isn't large text, so it needs 4.5:1.

## Decisions
- [`T-027-input-edge-contrast.md`](../decisions/T-027-input-edge-contrast.md): The readability check also warns when the inputs blend into the page (3:1)
- [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md): Large text for contrast is 24px, or 18.66px and bold
- [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md): An outline Connect button uses bg as its border and fg as its text
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md): The photo contrast check is labelled approximate
- [`T-013-role-weights-shared-with-splash.md`](../decisions/T-013-role-weights-shared-with-splash.md): `WEIGHT` is exported from the renderer
- [`T-013-photo-line-never-rates.md`](../decisions/T-013-photo-line-never-rates.md): the Text panel never rates a photo
- [`T-027-readability-check-test-file-added.md`](../decisions/T-027-readability-check-test-file-added.md): adds `ReadabilityCheck.test.tsx`
- [`T-027-line-states-and-notice.md`](../decisions/T-027-line-states-and-notice.md): inline caption for ok and approximate, the amber Notice for failures (superseded)
- [`T-027-readability-verdict-live-only.md`](../decisions/T-027-readability-verdict-live-only.md): the same states, with only the verdict live
- [`T-027-outline-button-message-on-background.md`](../decisions/T-027-outline-button-message-on-background.md): an outline button's failure reads "on the background"
- [`T-027-photo-average-cache.md`](../decisions/T-027-photo-average-cache.md): one sampled average per photo, shared by every mount
- [`T-027-fitted-photo-checks-backdrop.md`](../decisions/T-027-fitted-photo-checks-backdrop.md): a fitted photo is also checked against its backdrop
