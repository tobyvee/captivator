---
title: "UndoRedo gets a co-located jsdom test file"
type: decision
project: captivator
ticket: T-025
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, testing, undo]
---
# UndoRedo gets a co-located jsdom test file

## Context
The ticket's `touches` lists only `store.undo.test.ts` (node environment), but the acceptance criteria include the button states and Cmd+Z in a text field undoing text rather than the design, which need a DOM. The calling session allowed `src/editor/UndoRedo.test.tsx`, as other editor components have (`T-024-export-button-test-file-added.md`).

## Decision
`src/editor/UndoRedo.test.tsx` (jsdom, Testing Library, `userEvent.setup()`) covers labels and titles, disabled states, click undo and redo, each shortcut, `preventDefault`, the skipped text-entry targets, the range-slider exception and unmount.

## Alternatives
- Test only the store: leaves the keyboard listener and button states unchecked.

## Consequences
One more jsdom file. Its `beforeEach` clears the temporal history after resetting the store.
