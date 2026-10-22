---
title: "The Fix button ignores the repeat clicks of a double-click"
type: decision
project: captivator
ticket: T-035
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast, undo]
---
# The Fix button ignores the repeat clicks of a double-click

## Context
T-035's code review found that a double-click on Fix applied two Fixes. After the first click the line re-renders, and the next failure's Fix button appears in the same spot, so the second click lands on it. The two changes are less than 400ms apart, so the undo debounce folds them into one step (`general-undo-leading-edge-debounce.md`). One Undo then reverts both.

## Decision
The click handler applies the Fix only when `event.detail <= 1`. The first click of a double-click has detail 1 and the second has 2. Clicks from the keyboard (Enter or Space) have detail 0, so they still work.

## Alternatives
- **Disable the button for a moment after a Fix:** this needs a timer and state, and the delay would be arbitrary.
- **Pause undo history around each Fix so it's always its own step:** this keeps both Fixes. The customer still gets a second change they didn't ask for.
- **Move focus or the button after a Fix:** this changes the layout to work around the click.

## Consequences
Fast deliberate clicks on two different Fixes count as one double-click, so the second does nothing. The customer clicks again. Tests that apply two Fixes move the clock at least 400ms between them.
