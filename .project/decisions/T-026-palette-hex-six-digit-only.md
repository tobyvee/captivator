---
title: "dedupePalette accepts only 6-digit #RRGGBB and drops 3-digit hex"
type: decision
project: captivator
ticket: T-026
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, palette]
---
# dedupePalette accepts only 6-digit #RRGGBB and drops 3-digit hex

## Context
Code review of T-026 found that `dedupePalette`'s test claimed to expand short hex (`#abc`) without its data proving it. The only caller is `paletteFromPixels`, which passes `toHex` output, always 6-digit `#RRGGBB`, so the 3-digit branch had no caller.

## Decision
`parseHex` accepts only 6-digit hex (case-insensitive, trimmed). Anything else, `#abc` included, is dropped like any other invalid entry, and tests pin that.

## Alternatives
- Keep 3-digit expansion and fix the test to prove it: tested code that nothing calls, kept only for a hypothetical caller.

## Consequences
A future caller that feeds `dedupePalette` user-typed colours must normalise them to `#RRGGBB` first.
