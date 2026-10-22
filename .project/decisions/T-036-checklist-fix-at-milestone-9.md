---
title: "Fixes found by the real-phone checklist are milestone 9 tickets"
type: decision
project: captivator
ticket: [T-036, T-029]
decided_by: ticket-planner
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, planning]
---
# Fixes found by the real-phone checklist are milestone 9 tickets

## Context
T-036 fixes the editor shell's layout, which T-008 built at milestone 2, but it was found by the T-029 checklist at milestone 9. Milestones 2 to 8 are closed and committed. Existing follow-up tickets took their feature's milestone (T-033 at 4) when that milestone was still open in the plan, and T-029's ticket says failures become new tickets via `/plan-tickets`.

## Decision
T-036, and any later fix a T-029 checklist failure produces, is `milestone: 9`. It lands within step 9, after the checklist that found it and before the README (T-030), so the README describes the fixed app.

## Alternatives
- **`milestone: 2`, the editor shell's step:** reopens a closed milestone whose commit history is already written, and would let `/prioritise-tickets` schedule it as if it belonged before steps 3–8.
- **A new milestone 10:** the spec's build plan has nine steps; a tenth would sit after the README and final deploy.

## Consequences
`/prioritise-tickets` must schedule T-036 before T-030. `T-029-checklist-and-readme-run-last.md` keeps T-029 and T-030 last; T-036 needs no `depends_on` on T-029, because T-029 is a main-session ticket already in progress, and the fix should land while the checklist is still being run so the item can be re-checked.
