---
title: "The store starts from the Sponsor template"
type: decision
project: captivator
ticket: T-004
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, persistence]
---
# The store starts from the Sponsor template

## Context
The spec's persistence rules fall back to "the template" without naming it. `/editor` can be opened directly, without going through the picker.

## Decision
The initial design is `SPONSOR.design` and the initial name is empty. Every fallback keeps it: no saved design, corrupt JSON, a schema-invalid design, or an older version.

## Alternatives
- **Blank:** an editor that looks empty when opened directly or after a failed restore.

## Consequences
The persistence tests assert Sponsor. The picker's "Use" still loads whichever template is chosen.
