---
title: "An outline CLOSE switches to the sheet's text colour when button.fg fails 4.5:1 on the sheet"
type: decision
project: captivator
ticket: [T-021, T-007]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, terms, contrast]
---
# An outline CLOSE switches to the sheet's text colour when button.fg fails 4.5:1 on the sheet

## Context
`T-007-outline-button-colours.md` checks an outline label against the page background, because the button has no fill. CLOSE sits on the terms sheet, whose colour is the background's colour, gradient start or photo backdrop. That is not what a guest sees behind Connect, and it is the only thing behind CLOSE. The T-021 splash audit found that a photo background with a dark backdrop and an outline button with `fg: #111111` makes CLOSE's label unreadable: Connect reads fine over the photo, but CLOSE doesn't on the dark sheet.

## Decision
CLOSE spreads `connectButtonStyle(button)`. When `button.variant` is `"outline"` and `contrastRatio(button.fg, sheet) < 4.5`, CLOSE's `color` and `border` use the sheet's resolved text colour (`T-021-sheet-text-black-fallback.md`), which always reaches 4.5:1. A solid CLOSE keeps `bg`/`fg` unchanged, because its label sits on its own fill.

## Alternatives
- **Always use `button.fg`:** CLOSE fails contrast, the audit finding.
- **Always use the sheet text colour for an outline CLOSE:** this drops the customer's button colours even when they read well.
- **Recolour only the label and keep the `bg` border:** the label passes, but the border may vanish on the sheet, leaving an unframed word where the guest expects a button.

## Consequences
For outline designs whose `fg` fails on the sheet, CLOSE won't match Connect's colours. T-027's contrast checks don't need to flag CLOSE separately.
