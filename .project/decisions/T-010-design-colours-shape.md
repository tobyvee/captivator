---
title: "designColours returns uppercase hex, caps itself at 8, and takes only the backdrop from a photo background"
type: decision
project: captivator
ticket: T-010
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor]
---
# designColours returns uppercase hex, caps itself at 8, and takes only the backdrop from a photo background

## Context
T-010 asks for `designColours(design)` deduplicated case-insensitively and an "In this design" row of up to 8 colours, without saying which casing survives, where the cap applies, or whether a photo's overlay colours count.

## Decision
- Every colour is uppercased before deduplication, so output is always `#RRGGBB` and matches the swatch `aria-label`s.
- The function itself returns at most 8, in page order (background, text blocks, then input background, input text, terms text, button background, button text).
- A photo background contributes its `backdrop` only, not its overlay stops, as the ticket lists.
- `logoPalette` entries get the same treatment (uppercased, invalid hex dropped, deduplicated) before display; the store is not changed.

## Alternatives
- **Keep the first occurrence's casing:** two swatches could carry labels differing only by case across rows.
- **Cap in the component:** callers of the export would get a different list from what is shown.

## Consequences
A design with more than 8 colours drops the form's last colours (button colours first) from the row.
