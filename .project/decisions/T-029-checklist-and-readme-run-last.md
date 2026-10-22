---
title: "The phone checklist and README run after every other ticket"
type: decision
project: captivator
ticket: [T-029, T-030]
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, planning]
---
# The phone checklist and README run after every other ticket

## Context
`/prioritise-tickets` fills waves greedily by priority. `T-029`'s `depends_on` leaves out the cuttable tickets, so that a cut never blocks it (`T-029-phone-checklist-at-step-9.md`). Nothing is cut and the stretch work is scheduled (`general-stretch-tickets-scheduled.md`). So the greedy order put `T-029` in wave 8 and `T-030` in wave 9, ahead of `T-022`, `T-026`, `T-028` and the stretch tickets `T-031` to `T-035`. The checklist would then run before the fit warning and guest screens it checks exist, and the README would describe an app that's still changing.

## Decision
`T-029` and `T-030` stay out of the greedy fill and run as the last two waves, each on its own, after every other scheduled ticket.

## Alternatives
- Add the cuttable and stretch tickets to `T-029`'s `depends_on`: a later cut would then block the checklist, which `T-029-phone-checklist-at-step-9.md` set out to avoid.
- Keep the greedy order: the checklist and README run against an unfinished app.

## Consequences
Every re-run of `/prioritise-tickets` keeps these two last until they're done. If tickets are cut later, the two still run last, over whatever remains.
