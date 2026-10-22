---
title: "The Connected heading and badge use the first heading's colour only when it reaches 3:1 on the page, otherwise bestTextColour"
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, contrast]
---
# The Connected heading and badge use the first heading's colour only when it reaches 3:1 on the page, otherwise bestTextColour

## Context
T-022 code review, should-fix. The ticket colours the tick badge and "You're online" with "the first heading's colour, or `bestTextColour(bg)`". The code used the heading colour whenever a heading existed. `general-guest-screen-fallbacks.md` uses a heading's colour on a guest screen only when it passes contrast, as the terms sheet does. A heading colour chosen for a photo or a different block can fail on the page.

## Decision
The accent is the first heading's colour when its worst ratio on `backgroundColours(background)` reaches `requiredRatio(40, 800)`, which is 3:1 because 40px/800 is large text. Otherwise the accent is `bestTextColour(page)`. The badge and the h1 share the accent. The tick keeps `mainBackgroundColour(background)`.

## Alternatives
- **4.5:1, the terms sheet's threshold:** the sheet's body is 15px text. This title is large text, so WCAG asks 3:1, and a stricter bar would drop on-brand heading colours that read well at 40px.
- **`readableTextColour` (with the black fallback) as the fallback:** `bestTextColour` already reaches 3:1 on any single colour. Only a two-stop gradient whose stops need opposite text can fail, and black doesn't fix that.

## Consequences
On a page where the heading colour fails, the Connected screen's accent differs from the landing page's heading. No template's Connected screen changes.
