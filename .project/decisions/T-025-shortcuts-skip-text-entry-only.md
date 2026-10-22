---
title: "Undo shortcuts skip text-entry fields only; sliders and checkboxes still undo the design"
type: decision
project: captivator
ticket: T-025
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, undo, keyboard]
---
# Undo shortcuts skip text-entry fields only; sliders and checkboxes still undo the design

## Context
The ticket says the listener ignores events whose target is an `input`, `textarea`, `select` or contenteditable. The spec says "ignored when focus is in a text input or textarea, so native text undo still works there". The editor has range sliders (`controls/Slider.tsx`) and checkboxes, which have no native undo: ignoring them would make Cmd+Z do nothing right after a slider drag, while focus is still on the slider.

## Decision
The listener ignores `textarea`, `select`, contenteditable and every `input` except `button`, `checkbox`, `color`, `file`, `image`, `radio`, `range`, `reset` and `submit`. Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z and Ctrl+Y redo (not Cmd+Y, which browsers use for history). Alt combinations, IME composition and already-prevented events are left alone. `preventDefault` runs whenever a shortcut is handled.

## Alternatives
- Ignore every `input`, as the ticket's wording reads: blocks design undo from sliders, the controls most likely to hold focus after a drag.

## Consequences
The design-name input, panel text fields and textareas keep native text undo, as the acceptance criteria require.
