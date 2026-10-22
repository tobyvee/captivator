---
title: "The dominant colour comes from fast-average-color's array API over the opaque 32x32 sample, not getColorAsync on the image"
type: decision
project: captivator
ticket: T-026
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, palette, images]
---
# The dominant colour comes from fast-average-color's array API over the opaque 32x32 sample, not getColorAsync on the image

## Context
The ticket says to take the dominant colour with `getColorAsync(img, { algorithm: "dominant" })` and to skip pixels with alpha below 128 for k-means. fast-average-color's dominant algorithm buckets transparent pixels too: a logo on a transparent background usually has transparent `[0,0,0,0]` as its biggest bucket, and with zero alpha weight that bucket returns the default colour, black. The spec says to run it "on the downscaled canvas".

## Decision
`extractPalette` draws the image to the 32x32 canvas once, keeps pixels with alpha 128 or more, and passes that same opaque sample to `fac.getColorFromArray4(sample, { algorithm: "dominant" })` and to `kmeans`. The pure part is exported as `paletteFromPixels(rgbaData)`, so the dominant step, the alpha filter and the dedupe are unit-tested in Node.

## Alternatives
- `getColorAsync(img, { algorithm: "dominant" })` as written: transparent logos get a black first swatch, and the image is decoded twice.
- `ignoredColor: [0, 0, 0, 0]`: misses semi-transparent edge pixels, and doesn't match the k-means alpha rule.

## Consequences
The dominant colour and the k-means centres see exactly the same pixels. Only image decoding and the canvas draw are left to the manual check.
