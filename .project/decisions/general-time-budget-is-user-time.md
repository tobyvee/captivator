---
title: "The time budget is the user's own time and doesn't drive cuts"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes: general-estimates-at-1-5x.md
updated: 2026-10-22
tags: [project, captivator, decision, planning]
---
# The time budget is the user's own time and doesn't drive cuts

## Context
The spec's 3-hour coding budget, its step times and its "if behind, cut" order were being applied to agent work. `/plan-tickets` reported 465 minutes of tickets against a 270-minute plan (the 1.5× rule in `general-estimates-at-1-5x.md`). The user clarified that the budget measures their own time. Agents running in parallel don't use it up, because the user does other things while they run.

## Decision
The time budget isn't a planning constraint. Don't cut, defer or shrink work to fit it, and don't report ticket totals or critical paths against it. Cut work only when the user asks.

## Alternatives
- Keep planning at 1.5× the step times and cutting in the spec's order: treats agent run time as the user's time.

## Consequences
- Ticket estimates stay as sizing for splits and waves; they no longer feed a budget check.
- `cut_rank` stays as the order to cut in if the user asks for cuts.
- This overrides the spec's step times as a limit, CLAUDE.md's "If behind, cut", `/prioritise-tickets`' **Fit the budget** step and `ticket-planner`'s "3-hour coding budget" until those texts are updated.
- Stretch work's "only if ahead" trigger no longer has a budget to measure against. Whether to schedule it is still the user's call.
