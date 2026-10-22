---
title: "The colour popover ignores a press on a scrollbar only when the target is the root or a scroll container"
type: decision
project: captivator
ticket: [T-036, T-010]
decided_by: nextjs-specialist
supersedes: T-036-popover-ignores-scrollbar-press.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The colour popover ignores a press on a scrollbar only when the target is the root or a scroll container

## Context
`T-036-popover-ignores-scrollbar-press.md` judged a scrollbar press by geometry alone, assuming an inline element reports a zero scroll size as well as a zero client area, so the overflow guard would rule it out. Re-review measured headless Firefox 158: inline elements (`<span>`, `<label>`, `<a>`, `<strong>`) report `clientWidth`/`clientHeight` 0 but `scrollWidth` as their box's width, so the guard passed and every press on inline text counted as a scrollbar press, and the popover never closed. Chrome still sends `pointerdown` to a scroller when its scrollbar is pressed, which is why the check exists.

## Decision
The outside-press handler skips a press only when all of these hold:
- the target is the document root, or an element whose computed `overflow-x` or `overflow-y` is `auto` or `scroll` (only those have scrollbars);
- it overflows (`scrollHeight > clientHeight` or `scrollWidth > clientWidth`);
- the press, measured from its bounding box inset by `clientLeft`/`clientTop` (from the viewport for the root, whose box moves with the page's scroll), falls outside its `clientWidth × clientHeight` client area.

The function is `isScrollbarPress`.

## Alternatives
- **Geometry alone (the superseded decision):** wrong in Firefox, as above, and counted a border press on an overflowing `overflow: visible` element.
- **`offsetX >= clientWidth || offsetY >= clientHeight`:** misses a scrollbar on the left (RTL), and has the same inline-element problem.
- **Close on `click` instead of `pointerdown`:** dragging the picker's slider and releasing past the popover's edge fires a click on a common ancestor outside it, closing the popover mid-edit.
- **Ignore every press whose target is a scroll container:** a press on the inspector's own padding or empty space would no longer close the popover.

## Consequences
- A press on a scroll container's border still counts as a scrollbar press and leaves the popover open; borders are 1px, so this is harmless.
- A press in the stage's empty `both-edges` scrollbar gutter (about 15px on the side without a scrollbar, outside `<main>`'s client area, see `T-036-reserve-scrollbar-gutter.md`) also leaves it open. That is harmless too.
- Overlay scrollbars (the macOS default) take no layout space, so the check can't see them; there, a press on the scrollbar still closes the popover, as before.
- The press keeps focus where it was, so `onAnchorBlur` doesn't close the popover either.
- Any later outside-press handler (another popover) should reuse this check.
