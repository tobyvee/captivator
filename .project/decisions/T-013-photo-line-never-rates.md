---
title: "Over a photo, the Text panel shows only \"Check readability over your photo\", never a ratio or a fail"
type: decision
project: captivator
ticket: [T-013, T-027]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast]
---
# Over a photo, the Text panel shows only "Check readability over your photo", never a ratio or a fail

## Context
The T-013 review noted that the panel returns the photo message without computing a ratio, so it never says "Hard to read" over a photo. The spec and `general-photo-contrast-approximate.md` only rule out claiming a pass. T-027's design-wide line will rate photo designs from the photo's average blended with the overlay, so it may report a failure that this panel doesn't.

## Decision
Keep the ticket's wording: over a photo the panel shows the amber "Check readability over your photo" and no ratio. The panel has no photo average, and rating against `backdrop` alone would be wrong (the photo covers it).

## Alternatives
- **Rate against the backdrop:** measures a colour the guest mostly can't see.
- **Compute the photo average in the panel:** duplicates T-027's sampling and cache.

## Consequences
For photo designs, the readability line under the preview (T-027) is where a failure shows. Once T-027 caches the photo average, the panel could reuse it to show a ratio too; that's a later change that would supersede this file.
