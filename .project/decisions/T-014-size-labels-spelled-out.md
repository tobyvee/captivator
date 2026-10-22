---
title: "The Image panel's size buttons read Small, Medium and Large rather than S, M and L"
type: decision
project: captivator
ticket: T-014
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The Image panel's size buttons read Small, Medium and Large rather than S, M and L

## Context
The ticket and spec say "Segmented S / M / L". No artboard draws the Image panel. `Segmented` uses each option's `label` as the button's visible text and accessible name, so single letters would be announced as "S, toggle button".

## Decision
The options are labelled Small, Medium and Large, with values `sm`, `md` and `lg`. They fit the inspector column at three equal widths, like the Text panel's Heading / Subheading / Body row on `Main`.

## Alternatives
- **S / M / L as written:** terse for a non-technical customer and unclear to screen readers.
- **Letters with an `aria-label` each:** `Segmented` has no per-option `aria-label`, and changing its props is outside this ticket.

## Consequences
None for other tickets. The stored values are unchanged.
