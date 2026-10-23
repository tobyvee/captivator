---
title: "The PRD and tech spec assume no hardware vendor, and name the rental business only as \"the provider\""
type: decision
project: captivator
ticket: T-047
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, prd, spec, production-path]
---
# The PRD and tech spec assume no hardware vendor, and name the rental business only as "the provider"

## Context
The PRD's system context, requirements, constraints and phasing were written around one router vendor, one rental company's hardware and its product names. T-042 made the README's path to production vendor-neutral, but the PRD and spec still carried the assumptions. The user: "Remove the hardware assumptions from the PRD and Tech Spec and remove references to PopUp wifi, replacing them with something generic".

## Decision
The PRD and spec describe what any gateway must provide (an external splash URL, a unit identifier on the redirect, a login step, a walled garden), with each vendor behind an adapter and proven in a spike. The rental business is "the provider", its routers are "the gateway", and its product names are dropped.

## Alternatives
- **Keep the vendor detail as one worked example:** the user can't guarantee which hardware is in use, so a worked example would still read as the plan.

## Consequences
Router-specific parameter tables, firmware notes and vendor sources are gone from the PRD, so a gateway spike has to rediscover them for whichever hardware is in use. CLAUDE.md and the readme-writer agent now describe the production path the same way.
