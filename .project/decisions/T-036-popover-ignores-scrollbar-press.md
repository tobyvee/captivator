---
title: "The colour popover ignores a press on a scrollbar, judged by the press falling outside the scroller's client area"
type: decision
project: captivator
ticket: [T-036, T-010]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The colour popover ignores a press on a scrollbar, judged by the press falling outside the scroller's client area

## Context
T-036 made the inspector column scroll on its own. `ColourField` closes its popover on any `pointerdown` outside the swatch and popover (`T-010-popover-focus-rules.md`), and Chrome sends `pointerdown` to a scroll container when its scrollbar is pressed (measured in headless Chrome: the target is the scroller, and focus stays where it was). So dragging the inspector's scrollbar to reach an open popover closed it. The code review suggested an `offsetX >= clientWidth` check.

## Decision
The outside-press handler skips a press when the target is an element that overflows (`scrollHeight > clientHeight` or `scrollWidth > clientWidth`) and the press, measured from its bounding box inset by `clientLeft`/`clientTop`, falls outside its `clientWidth × clientHeight` client area. The root element is measured from the viewport instead, because its box moves with the page's scroll while its scrollbars don't.

## Alternatives
- **`offsetX >= clientWidth || offsetY >= clientHeight`:** misses a scrollbar on the left (RTL), and counts every press on an inline element as a scrollbar press, because inline elements report a zero client area.
- **Close on `click` instead of `pointerdown`:** a scrollbar drag fires no click, but dragging the picker's slider and releasing past the popover's edge fires a click on a common ancestor outside it, which would close the popover mid-edit.
- **Ignore every press whose target is a scroll container:** a press on the inspector's own padding or empty space would no longer close the popover.

## Consequences
A press on a scrolling element's border also counts as a scrollbar press and leaves the popover open; borders are 1px, so this is harmless. Overlay scrollbars (macOS default) take no layout space, so the check can't see them; there, a press on the scrollbar still closes the popover, as before. The press keeps focus where it was, so `onAnchorBlur` doesn't close the popover either. Any later outside-press handler (another popover) should reuse this check.
