---
title: "T-042: README path to production without vendor assumptions"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: []
touches:
  - README.md
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, readme]
---
# T-042: README path to production without vendor assumptions

## Context
The user: "Remove any assumptions from the README.md in path to production. I can't guarantee they're on peplink or use RADIUS. Generalise this text."

## Scope
- Rewrite the README's path to production and its next steps without Peplink, `sn`, `command=login`, Hono or RADIUS.
- **Out of scope:** the PRD, the spec and the export's click-through form, which the user didn't ask to change.

## Acceptance criteria
- [x] The README doesn't mention Peplink, RADIUS, `sn`, `form_action`, `command=login` or Hono.
- [x] The two-step submit, the edge portal service, consent records and the Unsplash notes still read correctly.

## Outcome
The path to production is gateway-neutral.

## Decisions
- [`T-042-production-path-vendor-neutral.md`](../decisions/T-042-production-path-vendor-neutral.md): The README's path to production assumes no router vendor or authentication method
