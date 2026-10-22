---
title: "In a wave, each ticket is reviewed and audited before it's pushed"
type: decision
project: captivator
ticket: none
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, workflow, review, security]
---
# In a wave, each ticket is reviewed and audited before it's pushed

## Context
`/implement-parallel` ran the code review and the audits once, on the whole wave, after every ticket had merged. It recorded a ticket with an unresolved must-fix as `blocked`. With a push per ticket (`general-push-after-each-ticket.md`), reviewing afterwards would publish unreviewed code to a public repo and a live URL. A ticket could also be pushed as done and then fail review.

## Decision
After each ticket merges, review and audit it the way `/implement-ticket` does, fix what's found, then record, commit and push it. If a must-fix, critical or high finding can't be fixed, the ticket comes off the branch before anything is pushed: its commits are kept on `blocked/<ticket-id>` and the branch is reset. The wave-wide security audit still runs at the end, to catch holes that only appear when tickets combine.

## Alternatives
- Push each ticket straight after merge and tests, and review the wave at the end: publishes unreviewed code, and "blocked" no longer means "not shipped".
- Review the whole wave first, then record and push each ticket: every push lands at the end, so no ticket is pushed any sooner than before.

## Consequences
- A wave runs up to four code reviews instead of one. That's agent time, which isn't the constraint (`general-time-budget-is-user-time.md`).
- Tickets that touch a trust boundary are audited twice: on their own, then with the rest of the wave.
