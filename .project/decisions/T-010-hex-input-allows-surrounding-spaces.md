---
title: "The hex input's maxLength is 9, so a pasted colour with surrounding spaces is trimmed, not cut off"
type: decision
project: captivator
ticket: T-010
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, controls]
---
# The hex input's maxLength is 9, so a pasted colour with surrounding spaces is trimmed, not cut off

## Context
T-010's ticket gives the hex input `maxLength` 7 (`#RRGGBB`). The input trims before it validates, but the T-010 review found that `maxLength` cuts a paste such as `" #ABC123"` before the trim runs, so a valid colour copied with a leading space reverts.

## Decision
`maxLength` is 9 (`HEX_MAX_LENGTH`), which leaves room for a space on each side. The value is still trimmed and must match `#?RRGGBB`, so anything else reverts on blur, as before.

## Alternatives
- Keep 7: valid pastes with whitespace fail silently.
- Strip whitespace on every keystroke: it changes what the customer sees while typing, for no gain over trimming on commit.

## Consequences
The ticket's "maxLength 7" criterion is met in spirit (a valid value is at most seven characters after trimming), not literally. A test covers pasting `" #abc123 "`.
