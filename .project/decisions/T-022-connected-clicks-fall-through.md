---
title: "The Connected screen's column lets clicks on empty space fall through to the root"
type: decision
project: captivator
ticket: [T-022, T-005]
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, editor]
---
# The Connected screen's column lets clicks on empty space fall through to the root

## Context
`T-005-background-select-on-own-target.md` selects the background only when a click lands on the root, the column or the spacer itself. The T-005 re-review found that T-022's `Connected` renders its own full-width column inside `Connected.tsx`, and `ConnectedProps` has no `onSelect`. On the 375px phone frame that column covers the page, so in edit mode a click on the background of the Connected screen would select nothing, which breaks T-009's "Clicking the page background selects Background".

## Decision
In `edit` and `preview` modes, `Connected`'s column wrapper gets `pointerEvents: "none"`, and its interactive or selectable parts (the CONTINUE button, and the sponsor image if it ever becomes selectable) get `pointerEvents: "auto"`. Clicks on empty areas then land on the root, which selects the background. Export markup is unchanged.

## Alternatives
- Add `onSelect` to `ConnectedProps`: this changes a stub contract T-005 fixed, for a single behaviour.
- Leave it: background selection silently fails on one screen.

## Consequences
T-022 adds a test that clicking the Connected screen's empty area in edit mode calls `onSelect({ kind: "background" })`, and that CONTINUE still calls `onContinue`. This matches how T-006's background layers use `pointer-events: none`.
