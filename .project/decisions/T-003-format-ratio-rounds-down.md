---
title: "formatRatio rounds down to one decimal so a failing ratio never reads as passing"
type: decision
project: captivator
ticket: T-003
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, checks]
---
# formatRatio rounds down to one decimal so a failing ratio never reads as passing

## Context
The ticket asks `formatRatio` for one decimal (e.g. `"2.1:1"`) without saying how to round. `#777777` on white is about 4.48:1, which fails 4.5:1 but would show as "4.5:1" with ordinary rounding (`toFixed(1)`), so a warning would print a number that looks like it meets the threshold.

## Decision
`formatRatio` truncates to one decimal (`Math.floor(r * 10) / 10`, with a tiny epsilon for float error), so 4.48 shows as "4.4:1". Whole numbers keep the decimal ("21.0:1"), matching the canvas's "8.0:1".

## Alternatives
- **`toFixed(1)` (round half up):** shows "4.5:1" for a failing 4.48.
- **Two decimals:** more precise, but noisier than the canvas's one-decimal copy.

## Consequences
Displayed ratios can read up to 0.1 lower than the true value. Pass/fail is always decided on the unrounded ratio, never on the string.
