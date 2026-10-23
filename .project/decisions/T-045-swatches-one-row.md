---
title: "Colour suggestions sit in one unwrapped row under their title, as 30×44px targets around 24px dots"
type: decision
project: captivator
ticket: T-045
decided_by: main session
supersedes: T-010-swatch-tap-targets.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Colour suggestions sit in one unwrapped row under their title, as 30×44px targets around 24px dots

## Context
The user, with a screenshot of the "In this design" row: "The color chips are too far about. They shouldn't wrap." [`T-010-swatch-tap-targets.md`](T-010-swatch-tap-targets.md) made each suggestion a 44×44px button around a 24px dot, inline after the row's title. That leaves 20px between dots, and up to eight suggestions plus the title wrapped in the inspector. The narrowest inspector, at 1052px, has about 248px of content width.

## Decision
- The title ("In this design", "From your logo") sits on its own line.
- The suggestions sit in one `flex-nowrap` row below it. Each is a 30px-wide, 44px-tall button around the same 24px dot, so dots are 6px apart.
- The row is pulled 3px left, so the first dot lines up with the title.
- Eight suggestions take 237px, which fits the narrowest inspector. The current colour keeps its ring and `aria-pressed`, and the literal `#2563EB` accent is kept.

## Alternatives
- **Keep the title inline:** the title plus eight 30px targets is about 322px, so the row would still wrap or scroll.
- **Fewer suggestions:** it drops colours from the design.
- **24px targets:** the narrowest target the WCAG 2.2 AA rule (2.5.8) allows, but harder to hit than needed.

## Consequences
The suggestion targets are 30px wide, below the 44px used elsewhere in the editor. They're still 44px tall and above WCAG 2.2 AA's 24px minimum. The 44px rule for the guest page is unaffected.
