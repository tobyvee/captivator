---
title: "The Connected screen's sponsor line uses bestTextColour on the page, its heading stays in sentence case, and CONTINUE has no extra margin"
type: decision
project: captivator
ticket: T-022
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash]
---
# The Connected screen's sponsor line uses bestTextColour on the page, its heading stays in sentence case, and CONTINUE has no extra margin

## Context
The ticket sets the badge and heading colours but not the colour of "Thanks to our sponsor". `StateConnected` draws that line in white on a dark gradient, writes the heading as "YOU'RE ONLINE" and gives CONTINUE `margin-top: 8px`. The background main-colour helper in `TermsSheet.tsx` isn't exported, and that file belongs to T-021.

## Decision
- "Thanks to our sponsor" is 15px/500 in `bestTextColour(backgroundColours(background))`, so it reads on any background, as the canvas's white does on its dark one.
- The heading reads "You're online", as the ticket and spec write it, without forcing capitals.
- CONTINUE uses the column's 18px gap and adds no margin (CLAUDE.md: gap instead of margins).
- `Connected.tsx` has its own small `mainColour` helper (colour, gradient `from`, photo `backdrop`), following the same rule as the sheet.

## Alternatives
- **The first body or subheading colour for the sponsor line:** a design may have neither, and that colour was never checked against the page.
- **`textTransform: uppercase` on the heading:** the canvas's capitals come from its sample copy, and the template headings are already typed in capitals.
- **Export the sheet's helper from `TermsSheet.tsx`:** outside this ticket's `touches`.

## Consequences
If the sheet's colour rule changes, the copy in `Connected.tsx` must change with it.
