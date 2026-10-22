---
title: "Clicking the terms sheet's dim layer closes the sheet in edit and preview"
type: decision
project: captivator
ticket: [T-021, T-005]
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, terms]
---
# Clicking the terms sheet's dim layer closes the sheet in edit and preview

## Context
The T-005 re-review found a gap. `T-005-landing-under-sheet-inert.md` expects clicks outside the open sheet to fall through to the root, select the background and so return to landing. But T-021's dim layer (`position: absolute; inset: 0`) covers the landing and has no handler, so once T-021 lands, a click outside the sheet in edit mode would do nothing.

## Decision
In `edit` and `preview` modes, T-021's dim layer gets `onClick={onClose}`, the usual click-the-backdrop-to-dismiss. The sheet itself doesn't close on clicks inside it. In `export` the dim layer stays plain markup, because it closes through `#` links, not handlers.

## Alternatives
- `pointer-events: none` on the dim layer, so the root selects the background: this only closes the sheet in edit mode, through the store's selection rule, and does nothing in preview.
- No outside-click dismiss: guests and customers expect it, and the canvas's dim layer reads as a backdrop.

## Consequences
In edit mode, closing the sheet doesn't change the selection itself. `onScreenChange("landing")` runs, and the store keeps whatever is selected. T-021 adds a test that clicking the dim layer calls `onClose` in edit and preview, and that the export markup has no handler.
