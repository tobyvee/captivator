---
title: "The Connected screen's live region is a div with role=\"status\" around the h1, not role=\"status\" on the h1"
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, accessibility]
---
# The Connected screen's live region is a div with role="status" around the h1, not role="status" on the h1

## Context
T-022 splash audit. The ticket specifies `h1 "You're online" (role="status")`. An explicit `role` replaces the element's implicit one, so `<h1 role="status">` is no longer a heading. Screen-reader users lose the page's only heading and can't jump to it.

## Decision
`Connected` renders `<div role="status"><h1 …>You're online</h1></div>`. The div has no style, the h1 keeps the ticket's 40px/800 type and colour, and the region still announces the text when the screen appears.

## Alternatives
- **Keep `role="status"` on the h1, as the ticket writes it:** the heading role is lost.
- **`aria-live="polite"` on the h1:** keeps the heading, but the ticket and the audit name the status role. An `aria-live` attribute on a heading is also announced less consistently than a status region.

## Consequences
The Connected screen gains one wrapper element. It's a flex item of the column with the same 18px gaps, so the layout doesn't change. The export renders only the landing screen, so the export guard is unaffected.
