---
title: "T-003: Contrast helpers"
type: ticket
project: captivator
status: done
priority: P1
milestone: 1
estimate: 10
depends_on: [T-001]
touches:
  - src/lib/contrast.ts
  - src/lib/contrast.test.ts
cut_rank:
updated: 2026-10-22
tags: [project, captivator, ticket, lib]
---
# T-003: Contrast helpers

## Context
Build step 1 includes the contrast tests ([spec → Checks → Contrast](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Unit tests*). This pure module is used by the Terms sheet colours (T-021), the Error screen colour (T-022), the Text and Terms panels' contrast line (T-013, T-020), new text defaults (T-012) and the design-wide readability check (T-027, which lives in its own `readability.ts`). Decisions: [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md), [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md), [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md).

## Scope
`src/lib/contrast.ts`, pure (no DOM), exporting:
- `luminance(hex: string): number`: WCAG relative luminance.
- `contrastRatio(a: string, b: string): number`.
- `isLargeText(sizePx: number, weight: number): boolean`: `sizePx >= 24`, or `sizePx >= 18.66 && weight >= 700`.
- `requiredRatio(sizePx: number, weight: number): 3 | 4.5`.
- `blend(base: string, over: string, alpha: number): string`: hex of `over` composited on `base` at `alpha`.
- `backgroundColours(bg: BackgroundSpec, photoAverage?: string): string[]`:
  - colour → `[colour]`.
  - gradient → `[from, to]`.
  - image → the base is `photoAverage ?? backdrop`. With an overlay, return `[blend(base, overlay.from, opacity), blend(base, overlay.to, opacity)]`; without one, `[base]`.
- `worstRatio(fg: string, bgs: string[]): number`.
- `bestTextColour(bg: string | string[]): "#111111" | "#FFFFFF"`: whichever has the higher worst-case ratio.
- `bestErrorColour(bg: string | string[]): string`: `#FECACA` (light red) on dark backgrounds, `#B91C1C` (dark red) on light ones, chosen by the better worst-case ratio.
- `formatRatio(r: number): string`: one decimal, e.g. `"2.1:1"`.

`src/lib/contrast.test.ts` covers the spec cases plus the decision cases below.

**Out of scope:** the design-wide check and its messages (T-027); sampling a photo's average colour (browser-only, T-027).

## Acceptance criteria
- [x] White luminance is 1 and black is 0.
- [x] Black on white is 21:1.
- [x] `#777777` on white fails 4.5:1 (ratio ≈ 4.48).
- [x] Large text passes at 3:1: 24px/400 needs 3; 19px/800 needs 3 (decision); 19px/400 needs 4.5.
- [x] A gradient takes the worse stop: white text on `#FFFFFF`→`#000000` reports ≈ 1:1.
- [x] `bestTextColour` gives white on navy (`#0F2A44`) and near-black on yellow (`#FACC15`).
- [x] An image background with no `photoAverage` uses `backdrop` blended with both overlay stops.
- [x] `bestErrorColour` gives the light red on `#0F2A44` and the dark red on `#FFFFFF`.
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: Vitest and `BackgroundSpec` in `src/lib/types.ts`.

## Notes
- Relative luminance: for each sRGB channel `c = v/255`, use `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`, then `L = 0.2126R + 0.7152G + 0.0722B`. Ratio is `(L1+0.05)/(L2+0.05)` with `L1 >= L2`.
- Inputs are already 6-digit hex (the schema enforces `^#[0-9a-fA-F]{6}$`).

**Outcome (2026-10-22):**
- 20 tests pass.
- The code review approved it with two should-fixes, both fixed:
  - The photo-overlay tests use opacity 0.25 with literal results, so a swapped `blend` argument order would now fail.
  - `toHex` no longer needs a tuple cast.
- Two nits were also fixed: `bestTextColour`'s return type comes from its constants, and `worstRatio` documents that its list must be non-empty.
- **For consumers (T-013, T-020, T-021, T-022, T-027, T-035):**
  - Decide pass or fail on the raw `worstRatio(...) >= requiredRatio(...)`, never on the `formatRatio` string.
  - On a tie, `bestTextColour` picks near-black and `bestErrorColour` picks light red.
  - A photo with no overlay has `overlay: null`.

## Decisions
- [`T-003-format-ratio-rounds-down.md`](../decisions/T-003-format-ratio-rounds-down.md): formatRatio rounds down to one decimal so a failing ratio never reads as passing
- [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md): Large text for contrast is 24px, or 18.66px and bold
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md): The photo contrast check is labelled approximate
