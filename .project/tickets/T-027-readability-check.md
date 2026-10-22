---
title: "T-027: Readability check under the preview"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 8
estimate: 15
depends_on: [T-003, T-009]
touches:
  - src/lib/readability.ts
  - src/lib/readability.test.ts
  - src/editor/checks/ReadabilityCheck.tsx
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
- [ ] Blank's design reports "All text is readable" (test).
- [ ] White text on a white background reports "Heading: 1.0:1 on the background" (spec checklist; test).
- [ ] A gradient uses the worse stop (test).
- [ ] A passing photo design reports `approximate` with "Check readability over your photo" (test).
- [ ] An outline button checks `fg` against the page background (test).
- [ ] Each failure carries a `target` that T-035 can act on (test one per kind).
- [ ] The check warns but never blocks editing.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: `backgroundColours`, `worstRatio`, `contrastRatio`, `requiredRatio`, `formatRatio`.
- T-009: the `ReadabilityCheck` stub and its place under the frame.

## Notes
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
