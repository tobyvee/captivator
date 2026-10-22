---
title: "From 1052px the editor's row is flex-nowrap and the outer column swaps min-h-screen for h-dvh"
type: decision
project: captivator
ticket: T-036
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, layout]
---
# From 1052px the editor's row is flex-nowrap and the outer column swaps min-h-screen for h-dvh

## Context
The ticket's scope adds `h-dvh`, `min-h-0` on the row and `overflow-y-auto` on each column at the side-by-side width, keeping the row's unprefixed `flex-wrap`. In a wrapping (multi-line) flex container, CSS Flexbox §9.4 sizes each line to its tallest item's content rather than to the container, so the columns would stretch to the inspector's full content height, overflow the viewport-tall row and scroll the page again. Measured in headless Chrome against the compiled CSS at 1280 × 720 with a 3000px inspector: with `flex-nowrap` added the document stays 633px (the viewport) and the inspector scrolls inside its column. The ticket's Notes also leave open whether to keep `min-h-screen` beside `h-dvh` or swap it.

## Decision
- The row adds `min-[1052px]:flex-nowrap` (the bases sum to exactly 1052px, so nothing wraps there anyway), keeping `flex-wrap` for narrower widths.
- The outer column adds `min-[1052px]:h-dvh min-[1052px]:min-h-0`, so on a browser where `100vh` is taller than `100dvh` (a tablet in landscape) `min-height` can't push the editor past the viewport.
- `PreviewStage.tsx` is unchanged: its `flex-1` section grows to its content inside the scrolling `<main>`, so the switcher sits at the scroll origin (measured: 20px below the column's top when the phone doesn't fit, centred when it does).
- The compiled CSS lowers `max-[1052px]:` to `@media not all and (min-width:1052px)` and `min-[1052px]:` to `@media (min-width:1052px)`, exact complements.

## Alternatives
- **Keep `flex-wrap` and give each column `h-full` at the breakpoint:** also caps the line, but is a second mechanism for what `flex-nowrap` says directly.
- **Keep `min-h-screen` beside `h-dvh`:** equal on desktop, but where `100vh` exceeds `100dvh` the page scrolls by the difference.

## Consequences
The breakpoint now appears in three variants (`max-[1052px]` on the inspector, `min-[1052px]` on the outer column, row and columns); a change to any column's flex basis changes all of them.
