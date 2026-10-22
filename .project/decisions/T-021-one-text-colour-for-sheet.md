---
title: "The terms sheet uses one text colour for the title, body, close × and version, with tints derived from it"
type: decision
project: captivator
ticket: T-021
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, terms, contrast]
---
# The terms sheet uses one text colour for the title, body, close × and version, with tints derived from it

## Context
The spec and `general-guest-screen-fallbacks.md` give the sheet a single text colour (the first heading's colour if it reaches 4.5:1 on the sheet, otherwise `bestTextColour`). The `StateTerms` artboard shows the title in the heading colour but the body in a fixed light grey (`#E4E4E7`), the close × and grab handle as white at 12% and 35%, and the version in a fixed grey. Those fixed greys and whites only work on a dark sheet.

## Decision
The resolved text colour is used for the title, the body and the × icon. The version uses it at `opacity: 0.7` (the "muted" line). The grab handle and the × button's fill are that colour as 8-digit hex at 35% and 12% alpha, so they show on light and dark sheets alike.

## Alternatives
- **Canvas greys for the body and version:** unreadable on a light sheet, and the ticket's acceptance criterion says the body follows the same fallback as the title.
- **Body always `bestTextColour`, title in the heading colour:** contradicts the ticket's criterion that the title *and* body switch together.
- **`color-mix()` for the tints:** needs Safari 16.2; the minimum target is iOS 15.4.

## Consequences
A bright heading colour (e.g. lime on navy) colours the whole body, not just the title. Body text always passes 4.5:1, because the colour was chosen for that. The version line at 70% opacity may fall below 4.5:1; it's metadata, not content.
