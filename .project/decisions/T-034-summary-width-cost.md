---
title: "The drag handle also costs the row summary 44px, which is accepted"
type: decision
project: captivator
ticket: T-034
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, block-list]
---
# The drag handle also costs the row summary 44px, which is accepted

## Context
T-034's review noted that `T-034-drag-handle-leads-the-row.md` only mentions the block name truncating in a narrow column. The summary loses the same 44px: at the narrowest content width (about 240px, reached when the column sits near its 272px basis, roughly 1052–1140px viewports) it gets about 63px of text, 8–9 characters. The summary is what tells two "Image" rows apart.

## Decision
Accept it: the handle stays at the row's left as the canvas draws it, and the summary truncates with an ellipsis. Below `md` the column is full width and nothing truncates.

## Alternatives
- **The handle in the right-hand controls:** departs from the `Main` artboard and crowds the move buttons instead.
- **Hide the handle at narrow widths:** the up/down buttons and keyboard drag still work, but the affordance would come and go with the window.

## Consequences
Two image blocks can look alike in a narrow column until one is selected. T-029 checks the narrow column on a real screen.
