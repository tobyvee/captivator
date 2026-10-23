---
title: "T-047: PRD and tech spec without hardware or provider assumptions"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 15
depends_on: []
touches:
  - .project/prd/Captive Portal Designer — PRD.md
  - .project/spec/Captivator MVP — Tech Spec.md
  - CLAUDE.md
  - .claude/agents/readme-writer.md
  - .claude/agents/ticket-planner.md
  - .claude/agents/milestone-reviewer.md
  - .claude/commands/plan-tickets.md
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, docs, prd, spec]
---
# T-047: PRD and tech spec without hardware or provider assumptions

## Context
The user: "Remove the hardware assumptions from the PRD and Tech Spec and remove references to PopUp wifi, replacing them with something generic".

## Scope
- PRD: replace the vendor-specific system context, router parameters, access modes, platform constraints, open questions, phasing and sources with what any gateway must provide. Name the rental business "the provider" and drop its product names.
- Spec: make the out-of-scope line and the README's path-to-production list vendor-neutral, and describe the export's click-through form as it is: one vendor's login step, kept as an example until the user decides (`T-047-export-comments-left-for-user.md`).
- CLAUDE.md and the agents and commands that name the production path: describe it the same way.

## Acceptance criteria
- [x] No mention of the router vendor, its management tool, its hardware models, the rental company or its products remains in the PRD, the spec, CLAUDE.md or `.claude/`. *Checked with grep.*
- [x] RADIUS appears only as one example of a gating mechanism.
- [x] The PRD's non-hardware content (editor design, schema, requirements, client constraints, compliance, metrics) is unchanged apart from naming.

## Decisions
- [`T-047-planning-docs-vendor-neutral.md`](../decisions/T-047-planning-docs-vendor-neutral.md): The PRD and spec assume no hardware vendor, and name the rental business only as "the provider" (user)
- [`T-047-scope-of-vendor-neutral-edit.md`](../decisions/T-047-scope-of-vendor-neutral-edit.md): Compliance stays, RADIUS is only an example, and records and code are unchanged (superseded)
- [`T-047-export-comments-left-for-user.md`](../decisions/T-047-export-comments-left-for-user.md): The export's vendor-specific login field and comments stay until the user decides, and the spec says so

## Notes
Code review (changes required, then fixed):
- The spec had described export comments the code doesn't have; it now describes them as they are.
- The gated flow now fits all three mechanisms.
- An unsupported claim about management APIs was reworded.
- "Provider" is no longer used for payment and identity providers.
- "AU-region" and two non-hardware points (the profile sanity check, and hosted-portal features not carrying over) were restored.
- The spec's PRD link points at the repo file.
- Three agent files no longer list RADIUS as a production-path component.

The spec used to link to a separate copy of the PRD, which wasn't changed and may still carry the vendor detail.
