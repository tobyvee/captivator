---
title: "An export with guest fields posts to a portal-service placeholder, not the router"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, export, privacy]
---
# An export with guest fields posts to a portal-service placeholder, not the router

## Context
Review finding 9: the export posted name, email and phone straight to `[ROUTER_FORM_ACTION]`, which the PRD forbids (*Where the portal service runs*).

## Decision
Designs with fields post to `[PORTAL_SUBMIT_URL]`, with a comment explaining the two hops. Only click-through designs post to `[ROUTER_FORM_ACTION]` with `command=login`.

## Alternatives
- Keep the router placeholder: it models a flow the product must not ship.

## Consequences
The export test asserts the right placeholder for each case. The README describes the two-hop flow.
