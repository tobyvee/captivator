---
title: "The README's path to production assumes no router vendor or authentication method"
type: decision
project: captivator
ticket: T-042
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, readme, production]
---
# The README's path to production assumes no router vendor or authentication method

## Context
The README's path to production followed the PRD's system context, which names Peplink routers (external splash routed on `sn`, `form_action` with `command=login`) and a RADIUS server. The user: "Remove any assumptions from the README.md in path to production. I can't guarantee they're on peplink or use RADIUS. Generalise this text."

## Decision
The section describes the production path in gateway-neutral terms:
- a fixed splash URL per router, keyed on whatever identifier the gateway adds to the redirect;
- guest details going to our service, which then completes the gateway's own login step;
- an edge portal service;
- access granted only once details are recorded, by whatever mechanism the gateway supports.

"What I'd do next" now starts by confirming which gateways are in use. The PRD is linked as one possible design.

## Alternatives
- **Keep Peplink and RADIUS as the worked example:** the user can't guarantee either.

## Consequences
The PRD, the spec and the export's click-through form still assume Peplink. That form's HTML comment names the Peplink router, and it sends a hidden `command=login`. They're unchanged, and the user hasn't asked to change them.
