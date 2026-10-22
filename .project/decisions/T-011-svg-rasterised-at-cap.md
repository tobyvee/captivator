---
title: "An SVG with a declared size is rasterised at the kind's cap, not at its own size"
type: decision
project: captivator
ticket: T-011
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, images, upload, svg]
---
# An SVG with a declared size is rasterised at the kind's cap, not at its own size

## Context
The ticket's pipeline step 2 decodes an SVG through an `<img>` and step 3 draws it "at `targetSize`", which never upscales. Logo SVGs often declare a small size (for example `width="160" height="48"`), so the logo was stored as a 160×48 raster. It looked soft in the preview, and on high-density screens. Code review flagged this.

## Decision
For an SVG source with a declared size, the declared size is scaled so its long edge equals the kind's cap (600 for `image`, 1600 for `background`) before drawing, keeping the aspect ratio. Larger SVGs still scale down to the cap. Rasters (PNG, JPEG, WebP) still never upscale, and `targetSize` keeps its never-upscale contract. An SVG with no intrinsic size is still drawn at 600×600, as the ticket says.

## Alternatives
- Draw at the declared size, as the ticket implied: a blurry logo from a format chosen because it scales.
- Draw at twice the declared size: arbitrary, and still soft for very small declarations.
- Upscale every source to the cap: rasters gain bytes without gaining detail.

## Consequences
- An SVG logo is always stored with its long edge at 600px. That's larger than a small declared size would give, but still within the stored-size warning for a typical logo.
- A sizeless SVG background stays at 600×600 rather than 1600.
- The fake-browser test covers a 160×48 SVG coming out at 600×180, and a small raster staying at its own size.
