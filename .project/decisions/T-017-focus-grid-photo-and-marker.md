---
title: "FocusGrid takes optional src and describedBy props, and marks the pressed square with the canvas's blue dot"
type: decision
project: captivator
ticket: [T-017, T-033]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# FocusGrid takes optional src and describedBy props, and marks the pressed square with the canvas's blue dot

## Context
T-017 gives `FocusGrid({ value, onChange })`. The `DesktopPreview` artboard draws the grid over a 150px thumbnail of the photo, with a blue dot at the focus point (the dot is the T-033 drag handle) and labels "Top left" … "Centre, selected". Without the photo the squares mean nothing, and without the dot `aria-pressed` is the only cue for sighted users. The help text sits in `PhotoAdjustments` but describes the grid.

## Decision
- **Props:** `value` and `onChange` as the ticket gives, plus optional `src` (the photo drawn behind the grid, `object-fit: cover`) and `describedBy` (the help text's id). The component stays prop-only, with no `"use client"`, per `T-008-use-client-on-stateful-modules.md` and `T-010-colourfield-keeps-use-client.md`.
- **Group:** `role="group"`, `aria-label="Focus point"`; PhotoAdjustments shows the visible "Focus point" label `aria-hidden`, as ImagePanel does for Size.
- **Labels:** the ticket's "Focus …" form: "Focus top left", "Focus top centre", "Focus top right", "Focus middle left", "Focus centre", "Focus middle right", "Focus bottom left/centre/right".
- **Pressed:** each axis rounds to the nearest of 0, 50 and 100 (`Math.round(v / 50) * 50`, so 25 goes to 50 and 75 to 100); exactly one square is pressed and shows the canvas's 18px blue dot at its centre.

## Alternatives
- **Grid only, no photo:** squares with no picture to aim at.
- **The dot at the exact focus coordinates:** that is the T-033 drag handle; with presets only, a dot at 0% sits half outside the grid and doesn't line up with the square's centre.
- **The canvas's "Top left" labels:** the ticket names "Focus top left", and the extra word helps out of context.

## Consequences
T-033 adds the draggable dot at the exact focus point and can drop the per-square marker when it does. The thumbnail crops wide or tall photos (cover), so a square's area of the thumbnail only approximates the photo region it picks.
