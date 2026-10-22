---
title: "The Form renders the terms row from build step 2; the error state comes with the guest screens"
type: decision
project: captivator
ticket: [T-007, T-012, T-022]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, planning]
---
# The Form renders the terms row from build step 2; the error state comes with the guest screens

## Context
The build plan puts the terms row in step 6. But three earlier things depend on it:
- Sponsor (step 1) has terms on.
- The SplashPage test cases (checkbox never pre-ticked, row absent when off) belong with the Form.
- Export needs the row.

Meanwhile the Error screen is cuttable (cut order item 3).

## Decision
- **T-007** renders fields, the terms row, Connect and all three modes.
- **T-012:** the block list's Terms switch ships with the rest of the block list in step 3.
- **T-022** (cut_rank 3) adds the error state and edit-mode validation to `Form.tsx`.

## Alternatives
- **Terms row in step 6:** `Form.tsx` would be edited by three tickets.
- **Error state in T-007:** it couldn't be cut along with the switcher.

## Consequences
Step 6 shrinks to the Terms panel, the sheet and the cuttable screens.
