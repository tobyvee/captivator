---
title: "In edit mode the terms row selects Terms once on any click except on the checkbox, which only toggles"
type: decision
project: captivator
ticket: [T-007, T-022]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, selection]
---
# In edit mode the terms row selects Terms once on any click except on the checkbox, which only toggles

## Context
T-007 says the edit-mode terms link calls `onSelect({ kind: "terms" })` and that clicking the row also calls it. The link sits inside the row's `<label>`, so handlers on both fire twice for a link click. A click on the label text also makes the browser toggle the checkbox and re-dispatch a click on it, which bubbles to the label as a second event. And T-022 reads the checkbox from the edit preview to validate Connect, so the customer must be able to tick it without the preview jumping to the Terms sheet (`T-004-terms-selection-switches-screen.md`), which remounts the landing page and loses the tick.

## Decision
Only the `<label>` has an edit-mode click handler; the link `<button type="button">` has none and selects Terms by bubbling. The handler ignores clicks whose target is the checkbox (so the box toggles without selecting) and otherwise calls `preventDefault()` (no toggle, no re-dispatched click) and `onSelect({ kind: "terms" })`, so each click selects once.

## Alternatives
- **Handlers on both the link and the label:** two `onSelect` calls per link click, and a second call from the label's re-dispatched checkbox click.
- **`stopPropagation` on the link:** still leaves the label's double fire, and goes against `T-005-background-select-on-own-target.md`.
- **The checkbox click also selects Terms:** the preview switches to the sheet and the tick is lost, so T-022 could never validate a ticked box.

## Consequences
In edit mode, clicking the checkbox ticks it without selecting the Terms row; Terms is selected from the label text, the link or the block list. T-022 can read `accept_terms` from the preview form as planned.
