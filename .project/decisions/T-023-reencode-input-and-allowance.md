---
title: "The export re-encodes the inlined background, and its allowance excludes the placeholder pixel"
type: decision
project: captivator
ticket: T-023
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, images]
---
# The export re-encodes the inlined background, and its allowance excludes the placeholder pixel

## Context
T-023 step 3 measures the page with the background swapped for a 1×1 PNG data URL and passes `PAGE_BUDGET − that size` to `reencode(src, allowance)`. It doesn't say whether `src` is the stored source or the inlined one, and the measured page still contains the pixel's own data URL, about 100 bytes.

## Decision
`reencode` receives the inlined background (always a raster data URL), so the photo is fetched from the network once. The allowance is `PAGE_BUDGET − (measured size − pixel URL length)`, floored at 0, so a re-encoded background exactly `allowance` characters long makes the page exactly `PAGE_BUDGET` bytes.

## Alternatives
- Re-encode from the stored `src`: fetches a template or Unsplash photo a second time, and adds a second failure point after inlining succeeded.
- Subtract the measured size as is: under-allows by the pixel's length, about 100 bytes.

## Consequences
The re-encode starts from a 1600px WebP 0.8 copy rather than the original file; at 1000px and below the extra generation isn't visible behind the overlay.
