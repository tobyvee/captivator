---
title: "The browser frame is measured before its first paint and capped at 1282px wide"
type: decision
project: captivator
ticket: T-009
decided_by: main session
supersedes: T-009-frame-containing-blocks.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, preview]
---
# The browser frame is measured before its first paint and capped at 1282px wide

## Context
The T-009 review found two problems with `T-009-frame-containing-blocks.md`'s browser frame. A `setWidth` from inside the `ResizeObserver` callback is a default-priority update that React 19 renders after the first paint, so every switch to Desktop painted one frame at full size before scaling, and resizes lagged a frame. And because the frame filled the stage while the scale stops at 1, a stage wider than 1282px showed the 1280px page pinned top-left inside a wider white window. The decision's reasoning, that dropping the canvas's 760px cap "only shrinks the preview on wide screens", had this the wrong way round.

## Decision
Everything in `T-009-frame-containing-blocks.md` still holds (the phone shell's `contain: layout`, the transform on the browser frame's absolutely placed shell, the scroller inside it), with two changes. The layout effect sets the width from `clientWidth` straight away, which React flushes before paint, and the observer's updates run in `flushSync`. The frame is `max-w-[1282px]`: the 1280px page plus its 2px border, so it never shows more window than page.

## Alternatives
- **Restore the canvas's 760px cap:** it would shrink the preview on every laptop for no gain; the ticket scales to the stage.
- **Centre the page inside a wider window:** a white margin round the page looks like part of the guest page.
- **Leave the one-frame flash:** it shows on every device switch.

## Consequences
On stages wider than 1282px the frame sits centred at full size with stage space either side. `flushSync` runs only from the observer callback, never during render.
