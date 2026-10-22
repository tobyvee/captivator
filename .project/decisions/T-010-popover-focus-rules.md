---
title: "The colour popover returns focus to the swatch on Escape only, takes focus on open and closes when focus tabs out"
type: decision
project: captivator
ticket: T-010
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The colour popover returns focus to the swatch on Escape only, takes focus on open and closes when focus tabs out

## Context
T-010 says the popover "closes on Escape and on outside click, and returns focus to the swatch". An outside click usually lands on another control (a different field, a block row), and pulling focus back to the swatch would undo that click's focus. The ticket also doesn't say where focus goes on open, or what happens when the keyboard user tabs past the picker.

## Decision
- Escape (from the swatch, the picker or the hex input) closes the popover and focuses the swatch.
- An outside press closes it and leaves focus wherever the press put it.
- Opening focuses the picker's saturation slider, so arrow keys work at once. The popover sits right after the swatch in the DOM, so Tab goes swatch, saturation, hue, hex input.
- Focus moving to an element outside the swatch, popover and hex input closes the popover.

## Alternatives
- **Return focus to the swatch on outside click too:** steals focus from the control the user just clicked.
- **Leave focus on the swatch when opening:** keyboard users must Tab to reach the picker, and the popover would stay open over the swatch rows after they tab on.

## Consequences
The popover is non-modal (`role="dialog"` without `aria-modal`). Panels using `ColourField` need nothing extra for keyboard handling.
