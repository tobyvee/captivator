---
title: "T-036 takes ColourField into its touches to keep the popover open when the inspector's scrollbar is pressed"
type: decision
project: captivator
ticket: T-036
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, colour-field]
---
# T-036 takes ColourField into its touches to keep the popover open when the inspector's scrollbar is pressed

## Context
T-036's review noted a side effect of the new scrolling inspector. `ColourField`'s outside-press handler closes the popover on any `pointerdown` outside the field, and Chrome sends `pointerdown` to a scroll container when its scrollbar is pressed. Dragging the inspector's scrollbar to reach an open popover would therefore close it. `ColourField.tsx` belongs to T-010, which is done, and no `todo` or `doing` ticket claims it.

## Decision
Add `src/editor/controls/ColourField.tsx` and its test to T-036's `touches`, and fix the press handler in this ticket.

## Alternatives
- **A follow-up ticket:** the bug only exists because of T-036, so shipping T-036 without the fix would ship a regression.
- **Leave it as a note:** wheel, trackpad and keyboard scrolling still work, but dragging a scrollbar is a normal way to scroll on Windows and with classic scrollbars.

## Consequences
T-036 lands a change to a control that every colour picker uses. Its tests must cover both cases: a normal outside press still closes the popover, and a press on a scrollbar doesn't.
