---
title: "The Text panel keeps its own copy of the role weights (800 / 500 / 400) for the contrast check"
type: decision
project: captivator
ticket: T-013
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, checks]
---
# The Text panel keeps its own copy of the role weights (800 / 500 / 400) for the contrast check

## Context
`requiredRatio(size, weight)` needs the block's weight, which comes from its role (spec → Blocks). The renderer's `WEIGHT` map lives in `src/splash/blocks/TextBlock.tsx` and isn't exported; that file is outside T-013's `touches`.

## Decision
`TextPanel.tsx` defines its own `WEIGHT` record with the spec's values (heading 800, subheading 500, body 400) and the same preset sizes the ticket gives.

## Alternatives
- **Export `WEIGHT` from `TextBlock.tsx`:** the single source, but outside this ticket's `touches`.
- **Pass a fixed weight:** a 19–23px heading would be told it needs 4.5:1 (`T-003-large-text-includes-bold.md`).

## Consequences
Two copies of the weights must agree. T-027's readability check needs the same map; whoever owns `TextBlock.tsx` next can export it and point both panels and the check at it.
