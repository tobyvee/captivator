---
title: "T-030's final full audit is the full-repo audit at 8035bda plus the wave 10 and SEC-1 audits of everything after it"
type: decision
project: captivator
ticket: T-030
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, security, audit]
---
# T-030's final full audit is the full-repo audit at 8035bda plus the wave 10 and SEC-1 audits of everything after it

## Context
`/implement-ticket` and `/implement-parallel` ask for a `full` security audit before the final milestone's deploy. That audit ran at `8035bda` while the user worked through the phone checklist, because T-029 changes no code. Code landed afterwards in T-036 and T-030.

## Decision
Count the full-repo audit at `8035bda` as T-030's final audit and as wave 11's closing audit. The later changes are covered by two narrower audits: wave 10's audit of `8035bda..498fbf2`, and the SEC-1 re-audit of `498fbf2..HEAD`. No second full-repo audit runs.

## Alternatives
- **Re-run a full-repo audit at the final commit:** this would repeat the same checks on code that hasn't changed since `8035bda`, apart from the two audited ranges.

## Consequences
The final record is three audits that each cover their own range: the full review doc (`2026-10-23-security-full-review.md`), the wave 10 audit (no findings, so no doc) and the SEC-1 re-audit. Any later change needs its own audit.
