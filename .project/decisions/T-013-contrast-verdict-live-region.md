---
title: "The Text panel's contrast line announces only its verdict, and uses the amber notice style for both a failure and a photo"
type: decision
project: captivator
ticket: T-013
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, checks, accessibility]
---
# The Text panel's contrast line announces only its verdict, and uses the amber notice style for both a failure and a photo

## Context
T-013 gives the contrast line's copy but not how a screen-reader user learns that a colour or size change made the text hard to read, nor how the failing and photo states look. The `Main` artboard only draws the passing state (green box, check icon). The ratio changes on every picker or slider step, so a live region holding it would announce constantly.

## Decision
- The verdict ("Easy to read", "Hard to read" or "Check readability over your photo") is an always-mounted `role="status"` span, so it's announced only when the verdict flips. The ratio detail beside it isn't live.
- Passing uses the canvas's green box and check icon. Failing and photo use the amber notice colours the preview's notices use (`T-009-notices-share-amber-style.md`) with a warning icon, since checks warn and never block.
- The detail reads "{r} against the background." (plus " Checked at both ends of the gradient." on gradients) or "{r}, needs {required}:1.". A photo shows the verdict line only.

## Alternatives
- **Make the whole box live:** every drag step would be announced.
- **No live region:** a keyboard user changing the colour wouldn't hear that the text became hard to read.
- **Red for failures:** reads as an error that blocks, which the checks never do.

## Consequences
T-020's Terms panel contrast line can reuse the same pattern. Tests find the verdict by `role="status"`.
