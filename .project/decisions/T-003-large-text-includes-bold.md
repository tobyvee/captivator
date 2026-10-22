---
title: "Large text for contrast is 24px, or 18.66px and bold"
type: decision
project: captivator
ticket: T-003
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, checks]
---
# Large text for contrast is 24px, or 18.66px and bold

## Context
Review finding 16 (`.project/review/2026-10-21-prd-and-spec-review.md`): the spec applies 3:1 only at 24px and up. Under WCAG, large text is 24px regular **or** about 18.66px bold, so headings at weight 800 qualify from 19px.

## Decision
`isLargeText(size, weight)` is true at 24px and up, or at 18.66px and up when the weight is at least 700. `requiredRatio` returns 3 for large text and 4.5 otherwise.

## Alternatives
- **The spec as written (24px only):** over-warns on bold headings between 19px and 23px.

## Consequences
The contrast tests include a 19px/800 case. The readability check (T-027) and the Text and Terms panels' contrast lines use this helper, so they agree.
