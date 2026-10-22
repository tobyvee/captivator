---
title: "The real-phone checklist is its own ticket at build step 9, run by the main session"
type: decision
project: captivator
ticket: [T-029, T-030]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, planning, docs]
---
# The real-phone checklist is its own ticket at build step 9, run by the main session

## Context
Review finding 24: the spec places the manual checklist in both step 8 ("Checklist (step 8)") and step 9 ("Run through the testing checklist on a real phone"). A `ticket-implementer` can't use a phone, and may only write decision files under `.project/`.

## Decision
- **T-029** sits at milestone 9, before the README (T-030). The main session runs it with the user and records the results in `.project/review/phone-checklist.md`.
- **Dependencies:** it depends only on non-cuttable tickets, so a cut never blocks it.

## Alternatives
- **Fold it into the README ticket:** the README would be written before failures are known.
- **Step 8:** the checklist would miss step 8's own features.

## Consequences
`/implement-parallel` should not hand T-029 to a worktree agent. Its `touches` is under `.project/review/`, which only the main session writes.
