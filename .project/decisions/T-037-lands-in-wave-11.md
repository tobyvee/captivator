---
title: "T-037, a layout fix the user reported after the checklist, lands in wave 11 alongside T-030"
type: decision
project: captivator
ticket: T-037
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, planning]
---
# T-037, a layout fix the user reported after the checklist, lands in wave 11 alongside T-030

## Context
After T-030 landed, the user reported with a screenshot that the readability Notice should stack under the preview caption. Fixes found by the checklist are milestone 9 tickets ([`T-036-checklist-fix-at-milestone-9.md`](T-036-checklist-fix-at-milestone-9.md)). Wave 11 is the last wave, and its only other ticket, T-030, touches none of this ticket's files.

## Decision
Ticket the fix as T-037 (P1, milestone 9) in wave 11, and build it in the main session with `/implement-ticket`'s checks, since it is a two-class change in one component.

## Alternatives
- **A new wave 12:** an extra wave for one ticket, with no file clash to separate it from T-030.
- **Fold it into T-030 as a touches change:** T-030 is the README and deploy ticket and is already recorded as done.

## Consequences
The plan becomes 37 tickets in 11 waves. Milestone 9 was closed by T-030's milestone review; this ticket reopens nothing in it and is recorded on its own.
