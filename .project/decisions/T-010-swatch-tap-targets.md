---
title: "Colour swatches are 44px buttons around the canvas's 24px dots, and the current colour is aria-pressed"
type: decision
project: captivator
ticket: T-010
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Colour swatches are 44px buttons around the canvas's 24px dots, and the current colour is aria-pressed

## Context
The `Main` artboard draws the picker swatch and hex input at 40px and the suggestion swatches as 24px buttons, but T-010 and CLAUDE.md require 44px tap targets. The canvas also marks the current colour with a blue ring without saying how that is announced. Tailwind v4's `blue-600` is not the canvas's `#2563EB`.

## Decision
- The picker swatch and hex input are 44px tall. Each suggestion is a 44×44 `<button>` holding a 24px dot, so the dot still looks like the canvas and the rows wrap.
- The suggestion matching `value` gets the canvas's 2px `#2563EB` ring and `aria-pressed="true"`; the rest are `aria-pressed="false"`.
- Accent and focus colours use the literal `#2563EB`, not Tailwind's `blue-600`.

## Alternatives
- **24px buttons as drawn:** fails the 44px rule.
- **No state on the current swatch:** screen-reader users can't tell which suggestion is in use.

## Consequences
Eight "In this design" swatches plus the row label wrap to two lines in the 320px inspector.
