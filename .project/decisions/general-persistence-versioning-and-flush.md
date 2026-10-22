---
title: "Persistence keeps version 2, flushes on page hide and reports failed restores"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, persistence]
---
# Persistence keeps version 2, flushes on page hide and reports failed restores

## Context
Review findings 11 and 12: there were two version numbers with unclear roles, an invalid stored design was discarded silently, and an edit made within 300ms of closing the tab was lost.

## Decision
- `captivator:v2` / `version: 2` match `Design.version` (2), and the two move together.
- When a stored design fails `safeParse`, the template is kept and `restoreFailed` is set, which shows a notice.
- Pending writes flush on `pagehide` and `visibilitychange: hidden`, and quota errors set the flag from the timer and from the flush.

## Alternatives
- Restart at version 1: it would disagree with the committed schema.
- Write synchronously: re-serialises data URLs on every slider tick.

## Consequences
Every schema change bumps both versions and adds a `migrate` step.
