---
title: "Edit mode selects the background only for clicks on the root, column or spacer themselves"
type: decision
project: captivator
ticket: [T-005, T-006, T-007, T-021, T-022]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, selection]
---
# Edit mode selects the background only for clicks on the root, column or spacer themselves

## Context
T-005's Notes put `onSelect({ kind: "background" })` on the root's `onClick` and have each block wrapper stop propagation. Code review found that every other clickable child (T-007's fields, terms and button selections, T-021's sheet, T-022's Connected) would also have to stop propagation, or the bubbled click overrides their selection with the background. Selecting the background while on the terms screen also sends the preview back to landing (`T-004-terms-selection-switches-screen.md`).

## Decision
In `edit` mode, one handler, `selectBackground`, is attached to the root, the content column and the spacer. It calls `onSelect({ kind: "background" })` only when `e.target === e.currentTarget`, i.e. the click landed on that element's own empty area. Block wrappers no longer stop propagation.

## Alternatives
- **Keep `stopPropagation` and require it in every child:** a contract four later tickets must each remember; one miss silently breaks selection.
- **Check `e.defaultPrevented` or a marker on the event:** same contract, in a different form.
- **Root-only `target === currentTarget`:** the column and spacer cover most of the page, so clicks on their empty area would select nothing.

## Consequences
T-007, T-021 and T-022 don't need `stopPropagation`. Any element a later ticket adds whose own empty area should count as background must get the same handler (inside `SplashPage.tsx`, or the click lands on it and selects nothing). T-006's layers must keep `pointer-events: none`, as its ticket already says, so clicks on them fall through to the root.
