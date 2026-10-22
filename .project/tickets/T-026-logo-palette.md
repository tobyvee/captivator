---
title: "T-026: Logo palette extraction"
type: ticket
project: captivator
status: done
priority: P1
milestone: 8
estimate: 10
depends_on: [T-011]
touches:
  - src/lib/palette.ts
  - src/lib/palette.test.ts
cut_rank: 4
updated: 2026-10-23
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
- [x] `dedupePalette` drops near-identical colours (e.g. `#FF0000` and `#FE0101`), keeps distinct ones, preserves order, and returns at most 4 (tests).
- [x] `kmeans` on two well-separated pixel groups returns their two centres (test).
- [x] Manual: uploading a logo fills "From your logo" with 3–4 distinct swatches in every colour picker. *The pure module is tested and the upload-to-picker wiring predates T-026 and is tested with the palette mocked; the real-browser check is on T-029's checklist ([`T-026-manual-palette-check-in-t029.md`](../decisions/T-026-manual-palette-check-in-t029.md)).*
- [x] `npm test` and `npx tsc --noEmit` pass.

## Dependencies
- T-011: the stub this replaces, and the `extractPalette` signature its callers use.

## Outcome
- **Built:** `src/lib/palette.ts` replaces T-011's stub. `extractPalette(dataUrl)` decodes the image, draws it to a 32×32 canvas and returns `[]` on any failure. `paletteFromPixels` skips pixels under half alpha, puts fast-average-color's dominant colour of the opaque sample first, then up to four k-means centres, largest cluster first, deduped at ΔE 10 (CIE76) to at most four uppercase `#RRGGBB`. No editor wiring was needed: `ImageUpload` already calls it and `ColourField` already shows the row. 753 tests pass; `tsc` and lint are clean.
- **Review:** changes required for two tests that claimed more than their data showed, plus a zero-iteration `kmeans` bug and an unneeded singleton; fixed by nextjs-specialist in `f9f3017` (3-digit hex support dropped as unused, [`T-026-palette-hex-six-digit-only.md`](../decisions/T-026-palette-hex-six-digit-only.md)). The re-review's should-fix (a six-character non-hex case) and nit (an unused `trim`) are fixed in `6a8875c`. Each new test was mutation-checked.
- **Security:** not a trust-boundary ticket; the wave audit covers it.

## Notes
- **Out of scope, from the review:** `ImageUpload.tsx` doesn't cancel an earlier `extractPalette` call, so two quick uploads from different controls could set their palettes out of order. Minor for suggestions-only state.
- **Background uploads give no palette:** `ImageUpload` only extracts for image blocks. Suggesting swatches from a background photo would be a change to `ImageUpload.tsx`.
Not unit-tested (needs a real browser): canvas sampling and fast-average-color. The palette is a suggestion only and is never written into `Design`.

## Decisions
- [`general-new-modules-beyond-project-structure.md`](../decisions/general-new-modules-beyond-project-structure.md): Planning adds small modules to the spec's project structure so each ticket owns its own files
- [`T-026-dominant-from-opaque-sample.md`](../decisions/T-026-dominant-from-opaque-sample.md): the dominant colour comes from the opaque 32×32 sample
- [`T-026-kmeans-drops-empty-sorts-by-size.md`](../decisions/T-026-kmeans-drops-empty-sorts-by-size.md): `kmeans` drops empty clusters and sorts largest first
- [`T-026-palette-hex-six-digit-only.md`](../decisions/T-026-palette-hex-six-digit-only.md): `dedupePalette` accepts only 6-digit hex
- [`T-026-manual-palette-check-in-t029.md`](../decisions/T-026-manual-palette-check-in-t029.md): the browser palette check moves to T-029
