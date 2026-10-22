---
title: "Tickets are estimated at 1.5x the spec's step times"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, planning]
---
# Tickets are estimated at 1.5x the spec's step times

## Context
Review finding 27: the spec's step times look tight (scaffold in 15 minutes, editor core in 45).

## Decision
`/plan-tickets` and `/prioritise-tickets` plan at 1.5× the spec's step times, so cuts show up front. The spec's times stay as the original targets.

## Alternatives
- Plan at 1×: the cuts would surface late, mid-build.

## Consequences
Against the 3-hour budget, the cut order is likely to apply from the start. P0 is never cut.
