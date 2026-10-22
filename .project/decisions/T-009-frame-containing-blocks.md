---
title: "The phone frame contains fixed descendants with contain: layout; the browser frame with the transform on its absolutely placed shell"
type: decision
project: captivator
ticket: [T-009, T-021]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, terms]
---
# The phone frame contains fixed descendants with contain: layout; the browser frame with the transform on its absolutely placed shell

## Context
`TermsSheet` is `position: fixed; inset: 0` in every mode (`T-021-fixed-sheet-in-every-mode.md`), so each frame needs a non-scrolling shell that is the containing block for fixed descendants, around a scroller that isn't. The ticket offers `transform` or `contain: layout`.

## Decision
- **`PhoneFrame`:** the 375×740 bordered shell carries `contain: layout` (inline, so it can't be purged or renamed) and `overflow: hidden`; the scroller inside it (`overflow-y: auto`) holds the splash root and the fold line.
- **`BrowserFrame`:** a box that reserves `800 × s` px holds an absolutely placed 1280×800 shell with `transform: scale(s)` and `transform-origin: top left`; the scroller inside the shell holds the splash root. `s` comes from a `ResizeObserver` on the box, started in a layout effect, and is `min(1, width / 1280)`, or 1 until the box is measured.
- The browser frame fills the stage's width. It doesn't keep the canvas's 760px cap: the ticket scales to the stage width, and the cap only shrinks the preview on wide screens.

## Alternatives
- **`transform: translateZ(0)` on the phone shell:** works, but creates a compositing layer for no visual reason.
- **The transform on the browser frame's scroller:** the sheet would scroll away with the page.
- **A statically placed 1280px shell:** its width would feed the box's min-content size; absolute placement keeps the box free to shrink.

## Consequences
The scrollers don't clip or scroll the sheet, because their shells, not the scrollers, are its containing block. Anything else `position: fixed` that SplashPage renders later is framed the same way. Where scrollbars take space, the phone's scrollbar narrows the page to about 360px.
