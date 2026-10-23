---
title: "The export's vendor-specific login field and comments stay until the user decides, and the spec says so"
type: decision
project: captivator
ticket: T-047
decided_by: main session
supersedes: T-047-scope-of-vendor-neutral-edit.md
updated: 2026-10-23
tags: [project, captivator, decision, prd, spec, export]
---
# The export's vendor-specific login field and comments stay until the user decides, and the spec says so

## Context
[`T-047-scope-of-vendor-neutral-edit.md`](T-047-scope-of-vendor-neutral-edit.md) said the rewritten spec matched the export code. Code review found it didn't. The spec described vendor-neutral export comments, but `src/lib/export.ts` still names one vendor's `form_action` and `command=login`, and `export.test.ts` checks for the vendor's name.

## Decision
Everything in the superseded decision stands except its claim about the export:
- The Australian compliance section stays, and the auth-server placement keeps "AU-region".
- RADIUS is one example of a gating mechanism, not the plan.
- Tickets, decisions and reviews are unchanged.

The spec now describes the export as it is: the click-through form's hidden `command=login` and its comment follow one vendor's login step as an example. Whether to make the export vendor-neutral waits on the user, and it's listed under Outstanding in STATUS.md.

## Alternatives
- **Change the export now:** it changes a guest-facing file and a test the user hasn't asked to change, and the question is already open with them.
- **Leave the spec describing neutral comments:** the auditors treat the spec as the source of truth, so they'd report the export as off-spec.

## Consequences
If the user says yes, a follow-up ticket rewrites `PORTAL_COMMENT` and `ROUTER_COMMENT`, decides what replaces the hidden field, and updates the `export.test.ts` assertion and this part of the spec.
