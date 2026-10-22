---
title: "The terms link gets 14px of vertical padding so its tap area reaches the 44px row"
type: decision
project: captivator
ticket: T-007
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, accessibility]
---
# The terms link gets 14px of vertical padding so its tap area reaches the 44px row

## Context
T-007's Notes give the terms link `padding: 0`. The splash audit found that its tap area is then one 14px line box, about 17px tall, inside a 44px row whose other taps tick the checkbox. A guest who narrowly misses the link ticks the box instead of opening the terms. CLAUDE.md's rule is that tap targets are at least 44px, with no inline-text exception.

## Decision
`TERMS_LINK` has `padding: "14px 0"`, in every mode. Vertical padding on an inline element enlarges its hit area without changing the line's layout.

## Alternatives
- Keep `padding: 0` under WCAG 2.5.8's inline-text exception: this is what `T-006-credit-links-inline-size.md` does for the photo credit. There, the nearest other target is far away; here, a near miss ticks the consent box.
- Make the link a block-level 44px element: this breaks the "I agree to the terms of use" sentence onto two lines.

## Consequences
The padding overlaps the row's own tap area, so a tap near the link text opens the terms rather than ticking the box. A unit test pins the padding, and T-029's phone checklist confirms it on iOS.
