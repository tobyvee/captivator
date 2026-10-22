---
title: "Selecting Terms switches the preview to the Terms sheet, in the store"
type: decision
project: captivator
ticket: [T-004, T-020]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store]
---
# Selecting Terms switches the preview to the Terms sheet, in the store

## Context
PRD *Terms editing*: "Selecting the pinned Terms row switches the preview to the Terms sheet", as the `EditorTerms` artboard shows. Selection comes from three places: the block list, the Inspector, and the preview's terms link in edit mode (render-mode table). The spec doesn't say where the switch happens.

## Decision
- **`setSelection`:** selecting Terms sets `screen: "terms"` when terms are on. Selecting anything else while on `"terms"` returns to `"landing"`.
- **`updateForm`:**
  - Returns to `"landing"` when terms are switched off on the terms screen.
  - Returns to `"landing"` when nothing can fail any more on the error screen.

## Alternatives
- **Switch in the block list's click handler:** the preview link would need the same code.
- **Leave the screen alone:** doesn't match the artboard.

## Consequences
Screen and selection stay consistent in one place, covered by store tests. The screen switcher can still show Terms independently.
