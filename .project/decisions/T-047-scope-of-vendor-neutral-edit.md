---
title: "The vendor-neutral edit keeps the Australian compliance section, keeps RADIUS only as an example, and leaves records and code unchanged"
type: decision
project: captivator
ticket: T-047
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, prd, spec]
---
# The vendor-neutral edit keeps the Australian compliance section, keeps RADIUS only as an example, and leaves records and code unchanged

## Context
[`T-047-planning-docs-vendor-neutral.md`](T-047-planning-docs-vendor-neutral.md) asked for the hardware assumptions and the rental company's name to go. Some content sat on the edge of that request.

## Decision
- **Compliance (Australia) stays.** It's about the jurisdiction of the events, not the hardware.
- **RADIUS stays as one example** of a gating mechanism, beside a gateway API and a signed token, not as the plan.
- **Historical records are unchanged:** tickets, decisions and reviews describe what was true when they were written, and committed decisions are never edited.
- **The export code is unchanged.** Its click-through form still writes a hidden `command=login` and a comment naming one vendor. The spec now calls that field an example to adapt per gateway, and whether to make the export itself neutral is an open question to the user.

## Alternatives
- **Drop the compliance section too:** it would lose the consent rules that shape P0 requirement 10, which no hardware choice changes.
- **Rewrite the export comment in this ticket:** it changes a guest-facing file and its tests, which the user hasn't asked for yet.

## Consequences
The spec describes the export's click-through field as an example, which matches the code and the README. If the user asks for a vendor-neutral export, a later ticket changes `src/lib/export.ts` and its tests.
