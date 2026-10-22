---
title: "The export re-encodes the background only when it doesn't fit, and ships the smaller copy"
type: decision
project: captivator
ticket: T-023
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, export, images]
---
# The export re-encodes the background only when it doesn't fit, and ships the smaller copy

## Context
The spec's Export section says the background is always re-encoded (1000px, then 800px, with quality stepping down) to fit the 100 KB budget. The T-023 code review found two costs in doing that unconditionally: a background that already fits is re-encoded and loses quality for nothing, and when no attempt fits, the best attempt replaced the inlined copy even if it was larger.

## Decision
`buildExportHtml` skips the re-encode when the inlined background is no larger than the allowance (the budget left after the rest of the page). Otherwise it re-encodes and ships the re-encoded copy only if it is a raster data URL smaller than the inlined one; a copy that fits is always smaller. `reencoded` stays true only when a re-encoded copy is what shipped.

## Alternatives
- Always re-encode, as the spec says: costs quality on backgrounds that already fit, and can ship a bigger page than the inlined copy.
- Re-encode always but compare sizes: still spends canvas work and a generation of loss when nothing needs to change.

## Consequences
An inlined background up to the allowance ships at its upload quality (1600px, WebP 0.8), so a fitting export can be larger than one re-encoded to 1000px, though never over budget. Tests must give a background larger than the allowance to exercise the re-encode path.
