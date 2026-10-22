---
title: "The drag handle is a 44px button at the left of each block row, as on the canvas, and the row name truncates when the column is narrowest"
type: decision
project: captivator
ticket: T-034
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor]
---
# The drag handle is a 44px button at the left of each block row, as on the canvas, and the row name truncates when the column is narrowest

## Context
T-034's notes say to put the handle "inside each block row's wrapper, beside the select button (the row's `controls` slot)" (`T-012-row-controls-focus-left-to-react.md`). The `Main` artboard draws the grip at the row's left, before the type icon. The controls slot is at the right, after the select button, where the 44×44 move buttons already sit. The column is 240–268px inside its padding, and every tap target must be at least 44px, so a third 44px control leaves the select button about 100px at the narrowest width.

## Decision
- `Row` gains a `leading` slot, a sibling before the select button, and block rows put the handle there: a 44×44 `<button>` with lucide `GripVertical` (zinc-400, zinc-500 when selected, as on the canvas). The Tab order follows the visual order: handle, select, up, down.
- With a handle, the select button drops its left padding, since the handle's own width spaces the icon from the row edge.
- The row name now truncates like the summary, so at the narrowest column "Subheading" can end in an ellipsis instead of overflowing the row.

## Alternatives
- **Handle in the `controls` slot, at the right:** same width cost, and departs from the canvas, where the grip is at the left.
- **A narrower handle (about 28px):** fits better but breaks the 44px tap-target rule.
- **Drop the type icon when a handle is present:** the canvas shows both.

## Consequences
At column widths under about 250px the block-row name can truncate. Pinned rows have no `leading` content and keep their old padding.
