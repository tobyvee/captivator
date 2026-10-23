---
title: "The PRD drops its P1 fast-follow list and its Constraints section"
type: decision
project: captivator
ticket: T-048
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, prd]
---
# The PRD drops its P1 fast-follow list and its Constraints section

## Context
The user: "Remove "P1 — fast follow" section and the entire "Constraints" section from the PRD".

## Decision
Both sections are removed. The four places that pointed at them are reworded to stand alone: the Summary's "(see Constraints)", the P0 preview banner's "(P1)", an open question's "No (P1)", and two agent files that named the Constraints section as a source.

## Alternatives
- **Move the constraints into a reference doc:** the user asked for removal, not relocation.

## Consequences
- The MVP's own constraints are unaffected, because they live in the spec and CLAUDE.md: the iOS 15.4 target, 16px inputs, 44px tap targets and no external requests.
- The PRD no longer explains why its P0 requirements exist: the client platforms, OS probes, gateway requirements, Australian compliance rules and the security model.
- Phasing step 4 still names paid access, live export, impersonation checks and i18n, which no longer have requirements of their own.
