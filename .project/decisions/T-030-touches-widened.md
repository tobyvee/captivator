---
title: "T-030 widens its touches to the screenshot, the security-headers fix and the checklist count"
type: decision
project: captivator
ticket: T-030
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, readme, security]
---
# T-030 widens its touches to the screenshot, the security-headers fix and the checklist count

## Context
T-030's `touches` listed only `README.md`, and its scope said "Out of scope: code changes". Landing it needed three more files changed:
- **The README screenshot:** the README shows one, which the ticket says the main session captures.
- **Security headers:** the final full audit raised SEC-1, which the T-001 deferral had named this ticket as the point to revisit.
- **The phone checklist:** review found that one of its rows covered two checks, so its pass count didn't match the README.

No `todo` or `doing` ticket claimed any of these files.

## Decision
Add `docs/editor.png`, `next.config.ts`, `src/app/security-headers.test.ts` and `.project/review/phone-checklist.md` to T-030's `touches`, and land the SEC-1 fix in this ticket ([`T-030-security-headers-added.md`](T-030-security-headers-added.md)).

## Alternatives
- **A separate follow-up ticket for the headers:** the final deploy would ship without the fix the audit asked for, or wait on an extra ticket for a three-header config change.
- **Note SEC-1 as a low under Notes:** that is the default for lows, but the deferral had already pushed this low to this ticket.

## Consequences
T-030 is no longer docs-only. The final deploy carries one code change, which has its own test and re-audit.
