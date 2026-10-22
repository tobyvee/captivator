---
title: "The readability check also warns when the inputs blend into the page (3:1)"
type: decision
project: captivator
ticket: [T-027, T-007]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, contrast, accessibility]
---
# The readability check also warns when the inputs blend into the page (3:1)

## Context
T-007's inputs have `border: 0`, as the canvas shows, so their only edge is `inputBg` against the page. The splash audit noted that Blank has white inputs on a white page (1:1), so a customer who adds a field to Blank gets inputs a guest can't see (WCAG 1.4.11 asks for 3:1). The spec's contrast check covers text only.

## Decision
T-027's `checkDesign` adds one check when there are fields: `inputBg` against `backgroundColours(bg, photoAverage)`, worst case, at 3:1. The message is "Fields: {ratio} on the background". It runs after the input-text check, so text problems are reported first.

## Alternatives
- A 1px border derived from `inputText`: this changes the canvas look for every design to fix a case the warning can catch.
- No check: Blank with a field would export invisible inputs with no warning.

## Consequences
Blank with a field shows this warning until the customer changes the background or the input colour. T-035's one-tap Fix doesn't cover it, so the warning has no Fix button.
