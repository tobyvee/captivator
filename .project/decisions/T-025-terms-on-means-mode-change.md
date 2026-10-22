---
title: "Only a change of terms mode to checkbox switches the screen, not a patch that leaves it on"
type: decision
project: captivator
ticket: T-025
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, terms]
---
# Only a change of terms mode to checkbox switches the screen, not a patch that leaves it on

## Context
`T-025-terms-switch-shows-terms-screen.md` says `updateForm` sets `screen: "terms"` when Terms is selected and "the patch turns `terms.mode` to `checkbox`". A patch can carry `mode: "checkbox"` while terms are already on, for example after the customer picked Landing in the screen switcher.

## Decision
The screen switches only when the stored mode wasn't `checkbox` and the merged form's is.

## Alternatives
- Switch whenever the patch contains `mode: "checkbox"`: a panel resending the current mode would move the preview off the screen the customer chose.

## Consequences
Covered by tests in `store.undo.test.ts`.
