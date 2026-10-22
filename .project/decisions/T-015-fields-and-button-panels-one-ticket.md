---
title: "The Fields and Connect button panels are one ticket"
type: decision
project: captivator
ticket: T-015
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor, planning]
---
# The Fields and Connect button panels are one ticket

## Context
By default each inspector panel is its own ticket. These two are each under 10 minutes, share dependencies (the shell and `ColourField`), and both edit `form`.

## Decision
T-015 builds `FieldsPanel.tsx` and `ButtonPanel.tsx` together.

## Alternatives
- **Two 10-minute tickets:** a wave slot and review overhead for no parallel gain.

## Consequences
File ownership is unchanged: both stubs come from T-008, and nothing else edits them.
