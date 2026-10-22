---
title: "The tech spec, not the PRD, owns the MVP plan, scope and cut order"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, planning]
---
# The tech spec, not the PRD, owns the MVP plan, scope and cut order

## Context
Review finding 6: PRD Phase 0 disagreed with the spec on the time budget, whether Export HTML is required, the cut order and undo grouping.

## Decision
PRD Phase 0 now defers to the spec. Its 4-hour plan and cut order are replaced with pointers. The budget reads "4 hours in total, 3 of them coding". Export HTML is required.

## Alternatives
- Sync the PRD's values to the spec: two copies would drift apart.
- Let the PRD win, making Export a stretch goal: the spec's reasons for requiring Export are stronger.

## Consequences
Agents planning or cutting work read the spec's Build plan only.
