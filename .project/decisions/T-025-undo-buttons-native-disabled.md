---
title: "Undo and Redo use the native disabled attribute when history is empty"
type: decision
project: captivator
ticket: T-025
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, undo, accessibility]
---
# Undo and Redo use the native disabled attribute when history is empty

## Context
`T-024-aria-disabled-keeps-focus.md` says later busy buttons should use `aria-disabled` so focus isn't lost. Undo and Redo aren't busy buttons: the spec and ticket say they're disabled when history is empty, and `editor.test.tsx` asserts `toBeDisabled()`.

## Decision
Native `disabled={!canUndo}` and `disabled={!canRedo}`, subscribed to `useStore.temporal`.

## Alternatives
- `aria-disabled`: keeps focus on Undo after the last step is undone, but breaks the shell's `toBeDisabled()` test and leaves a tab stop that does nothing.

## Consequences
Clicking Undo down to an empty history drops focus from the button. Keyboard users mostly use Cmd/Ctrl+Z, which isn't affected.
