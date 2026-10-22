---
title: "From 1052px each editor column reserves its scrollbar gutter, the stage on both edges"
type: decision
project: captivator
ticket: T-036
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, layout]
---
# From 1052px each editor column reserves its scrollbar gutter, the stage on both edges

## Context
Code review of T-036: with classic (non-overlay) scrollbars, each column's scrollbar appears and disappears as its content grows past the window, shifting the content about 15px. In the stage this also changes the width the Desktop preview's `BrowserFrame` scales from (ResizeObserver plus `flushSync`), which can oscillate near the threshold where the scrollbar comes and goes.

## Decision
At `min-[1052px]`, the block list and inspector columns get `[scrollbar-gutter:stable]` and the stage `<main>` gets `[scrollbar-gutter:stable_both-edges]`, as Tailwind v4 arbitrary properties (compiled to `scrollbar-gutter: stable` and `stable both-edges` inside `@media (min-width:1052px)`, checked in the built CSS). Below 1052px nothing scrolls inside a column, so nothing is reserved.

## Alternatives
- **`overflow-y-scroll` (always show the scrollbar):** stable too, but draws an empty track in every column that doesn't need one.
- **`stable` on the stage as well:** keeps the width fixed but moves the phone 7–8px left of the stage's centre.
- **Leave it:** content shift and a possible resize loop in the Desktop preview.

## Consequences
With classic scrollbars the side columns lose about 15px of content width and the stage about 30px, whether or not they scroll. Overlay scrollbars reserve nothing, so nothing changes there.
