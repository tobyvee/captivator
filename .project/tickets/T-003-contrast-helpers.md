---
title: "T-003: Contrast helpers"
type: ticket
project: captivator
status: todo
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
- [ ] White luminance is 1 and black is 0.
- [ ] Black on white is 21:1.
- [ ] `#777777` on white fails 4.5:1 (ratio ≈ 4.48).
- [ ] Large text passes at 3:1: 24px/400 needs 3; 19px/800 needs 3 (decision); 19px/400 needs 4.5.
- [ ] A gradient takes the worse stop: white text on `#FFFFFF`→`#000000` reports ≈ 1:1.
- [ ] `bestTextColour` gives white on navy (`#0F2A44`) and near-black on yellow (`#FACC15`).
- [ ] An image background with no `photoAverage` uses `backdrop` blended with both overlay stops.
- [ ] `bestErrorColour` gives the light red on `#0F2A44` and the dark red on `#FFFFFF`.
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-001: Vitest and `BackgroundSpec` in `src/lib/types.ts`.

## Notes
- Relative luminance: for each sRGB channel `c = v/255`, use `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`, then `L = 0.2126R + 0.7152G + 0.0722B`. Ratio is `(L1+0.05)/(L2+0.05)` with `L1 >= L2`.
- Inputs are already 6-digit hex (the schema enforces `^#[0-9a-fA-F]{6}$`).

## Decisions
- [`T-003-large-text-includes-bold.md`](../decisions/T-003-large-text-includes-bold.md): Large text for contrast is 24px, or 18.66px and bold
- [`T-006-overlay-two-stop-wash.md`](../decisions/T-006-overlay-two-stop-wash.md): The photo overlay renders as a top-to-bottom gradient of its two colours; fade direction is deferred
- [`general-photo-contrast-approximate.md`](../decisions/general-photo-contrast-approximate.md): The photo contrast check is labelled approximate
