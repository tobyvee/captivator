---
title: "The focus dot travels over the grid inset by its radius, drags only from the dot, and replaces the per-square marker"
type: decision
project: captivator
ticket: [T-033, T-017]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The focus dot travels over the grid inset by its radius, drags only from the dot, and replaces the per-square marker

## Context
T-033 draws the dot at `value.x%`/`value.y%` over the 150px focus box. Drawn against the full box, a dot at a corner preset (0%, 0%) would be three-quarters clipped by the box's `overflow: hidden`, and the presets put it there often. The ticket doesn't say whether a drag can start anywhere on the box or only on the dot, and `T-017-focus-grid-photo-and-marker.md` left T-033 to drop the per-square marker.

## Decision
- **Track:** the dot is placed, and pointer positions are mapped, over the box inset by 11px (the canvas dot's 18px plus its border, halved), so the dot stays whole at 0% and 100%. Positions round to whole percentages and clamp to 0–100; a move that lands on the current value calls nothing.
- **Target:** the dot is a 44px transparent `<button>` with the canvas's 18px blue dot centred in it, `touch-action: none` so a touch drag doesn't scroll the panel. It sits after the preset group (outside it), so it paints on top and comes after the nine squares in tab order.
- **Drag start:** only a main-button pointerdown on the dot starts a drag, with `setPointerCapture`; up, cancel or lost capture ends it. Tapping elsewhere on the box still hits a preset square.
- **Marker:** the per-square dot is gone; `aria-pressed` on the nearest square stays.

## Alternatives
- **The full box as track:** corner presets would show a sliver of dot.
- **Drag from anywhere on the box:** a tap on a square would also start a drag and fight the preset's click.
- **The dot inside the "Focus point" group:** the group would hold ten buttons, and the dot isn't a preset.

## Consequences
The thumbnail is `object-fit: cover` and the track is inset, so the dot's place over the thumbnail approximates the photo point it sets, as the squares already did. The drag relies on the store's leading-edge undo debounce for one undo step per drag; a pause of 400ms or more mid-drag makes a second step.
