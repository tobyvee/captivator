---
title: "The undo debounce keeps a timestamp and always records the first change after an undo, redo or clear"
type: decision
project: captivator
ticket: T-025
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, undo]
---
# The undo debounce keeps a timestamp and always records the first change after an undo, redo or clear

## Context
`general-undo-leading-edge-debounce.md` asks for a hand-rolled leading-edge debounce on zundo's `handleSet`. A plain gate goes wrong after an undo: a change within 400ms of the last edit would be folded into a step that's no longer on top, so it wouldn't be recorded, and zundo's stale redo states would survive it (they're cleared only when a step is recorded).

## Decision
`handleSet` is wrapped in a module-level gate that compares `Date.now()` with the last design change (no timer). It records when 400ms have passed since the last change, or when the history has no past states (after a clear) or has future states (after an undo).

## Alternatives
- A `setTimeout` gate: leaves a timer running, and still needs resetting from undo and redo.
- Override `undo`/`redo`/`clear` through `wrapTemporal` to reset the gate: same effect, with more typing against zundo's mutator generics.

## Consequences
Undo then redo back to the top, then an edit within 400ms, joins the redone step, as if the drag had continued. Fake-timer tests rely on Vitest faking `Date`, which it does by default.
