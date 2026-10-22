---
title: "Stretch tickets are scheduled, not held until the build is ahead"
type: decision
project: captivator
ticket: [T-031, T-032, T-033, T-034, T-035]
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, planning]
---
# Stretch tickets are scheduled, not held until the build is ahead

## Context
The spec runs stretch work "only if ahead" and says Unsplash is "never started unless step 8 finishes early". Both triggers measure against the time budget, which `general-time-budget-is-user-time.md` removed as a constraint. That left open whether `T-031` to `T-035` (Unsplash route and search, focus-point drag, dnd-kit reorder, one-tap contrast Fix) get scheduled at all.

## Decision
The stretch tickets go into the schedule. `/prioritise-tickets` places them in waves like any other `todo` ticket, keeping `priority: P2`, so they sort after P0 and P1 work.

## Alternatives
- Leave them unscheduled until the user asks: relies on an "ahead" trigger that no longer exists.

## Consequences
- The "only if ahead" and "unless step 8 finishes early" wording in the spec and in these tickets' Context no longer gates them.
- `cut_rank` on `T-031` to `T-033` still sets the cut order if the user asks for cuts.
- Unsplash search needs `UNSPLASH_ACCESS_KEY` set in the Vercel project to work in the deployed app.
