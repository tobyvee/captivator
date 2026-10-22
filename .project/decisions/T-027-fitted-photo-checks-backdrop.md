---
title: "A fitted photo is checked against its backdrop as well as its average colour"
type: decision
project: captivator
ticket: T-027
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, contrast, photo]
---
# A fitted photo is checked against its backdrop as well as its average colour

## Context
The spec rates a photo by its average colour blended with the overlay. The code review of T-027 found that once the average is known, the backdrop drops out of the check. With `fit: "fit"`, though, the backdrop fills the page around the photo, often exactly where the heading sits on a phone with a landscape photo. Dark text on a dark backdrop above a light photo was never flagged, though that failure can be measured exactly.

## Decision
For an image background with `fit: "fit"` and a known average, `checkDesign` checks text against both the photo's average and the backdrop, each blended with the overlay, and reports the worse. `fill` keeps the average only, because the photo covers the backdrop.

## Alternatives
- **Average only (the spec's wording):** misses a measurable failure.
- **Defer to a later ticket:** the fix is three lines inside T-027's own file.

## Consequences
A fitted photo can fail on its backdrop even when the photo's average passes, and the message still says "on the background". Photo results stay approximate (`general-photo-contrast-approximate.md`).
