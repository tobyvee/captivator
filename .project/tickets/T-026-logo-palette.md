---
title: "T-026: Logo palette extraction"
type: ticket
project: captivator
status: todo
priority: P1
milestone: 8
estimate: 10
depends_on: [T-011]
touches:
  - src/lib/palette.ts
  - src/lib/palette.test.ts
cut_rank: 4
updated: 2026-10-22
tags: [project, captivator, ticket, lib]
---
# T-026: Logo palette extraction

## Context
Build step 8, "logo palette" ([spec → Images and Unsplash → Logo palette](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Unit tests* → `images`: palette dedupe). This is cut order item 4. It replaces the `palette.ts` stub from T-011. Uploads already call `extractPalette` and pass the result to `setLogoPalette` (T-012, T-014), and `ColourField` already shows the "From your logo" row when it's non-empty (T-010). So this ticket only fills in the module. Decision: [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md).

## Scope
- `extractPalette(dataUrl: string): Promise<string[]>`:
  1. Load the image and draw it to a 32×32 canvas.
  2. Take the dominant colour from fast-average-color (`getColorAsync(img, { algorithm: "dominant" })`).
  3. Run a small k-means (k = 4, about 8 iterations, deterministic seeds from evenly spaced pixels, skipping pixels with alpha below 128) over the sample.
  4. Return `dedupePalette([dominant, ...centroids])`.
  5. Any failure returns `[]`.
- `dedupePalette(colours: string[], max = 4): string[]`: uppercase hex; drop any colour within ΔE ≈ 10 (CIE76 in Lab) of one already kept; keep order; return at most `max`.
- Export `kmeans(pixels: [number, number, number][], k: number, iterations?: number): [number, number, number][]` for testing.
- `palette.test.ts` (node environment; pure parts only).
- **Out of scope:** UI (T-010 already renders the row); wiring (done in T-012, T-014).

## Acceptance criteria
- [ ] `dedupePalette` drops near-identical colours (e.g. `#FF0000` and `#FE0101`), keeps distinct ones, preserves order, and returns at most 4 (tests).
- [ ] `kmeans` on two well-separated pixel groups returns their two centres (test).
- [ ] Manual: uploading a logo fills "From your logo" with 3–4 distinct swatches in every colour picker.
- [ ] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-011: the stub this replaces, and the `extractPalette` signature its callers use.

## Notes
Not unit-tested (needs a real browser): canvas sampling and fast-average-color. The palette is a suggestion only and is never written into `Design`.

## Decisions
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
