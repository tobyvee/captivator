---
title: "An outline Connect button uses bg as its border and fg as its text"
type: decision
project: captivator
ticket: [T-007, T-015, T-021, T-027]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash]
---
# An outline Connect button uses bg as its border and fg as its text

## Context
The schema's button is `{ label, bg, fg, variant: "solid" | "outline" }`. The spec doesn't say how `outline` uses the two colours. The Minimal card on the canvas shows a dark border with matching text on a light page.

## Decision
- **Solid:** fill `bg`, text `fg`.
- **Outline:** transparent fill, 2px border in `bg`, text `fg`.
- **Readability:** an outline label is checked against the page background, not `bg`.
- **Button panel:** labels the colours "Button colour" and "Text colour".

## Alternatives
- **Outline text in `bg`:** `fg` would be unused, and the panel's Text colour would do nothing.

## Consequences
The Terms sheet's CLOSE button and the Connected screen's CONTINUE button follow the same rule.
