---
title: "The terms sheet's single text colour falls back to #000000 when neither #111111 nor #FFFFFF reaches 4.5:1"
type: decision
project: captivator
ticket: T-021
decided_by: main session
supersedes: T-021-one-text-colour-for-sheet.md
updated: 2026-10-23
tags: [project, captivator, decision, splash, terms, contrast]
---
# The terms sheet's single text colour falls back to #000000 when neither #111111 nor #FFFFFF reaches 4.5:1

## Context
`T-021-one-text-colour-for-sheet.md` said the sheet body "always passes 4.5:1, because the colour was chosen for that". The T-021 splash audit showed this is false on mid-greys. On a `#777777` sheet, white reaches 4.48:1 and `#111111` reaches 4.22:1, so the heading colour and `bestTextColour` both fail and the body is below WCAG AA.

## Decision
Keep the earlier rule: one text colour for the title, body, close × and version, with the handle and × fill tinted from it, and the version at `opacity: 0.7`. The colour is the first heading's colour if it reaches 4.5:1 on the sheet, otherwise `bestTextColour(sheet)` if that reaches 4.5:1, otherwise `#000000`. Pure black reaches at least 4.58:1 on any colour. The sheet element sets the colour once, and the title, body and version inherit it.

## Alternatives
- **Change `bestTextColour` to return black:** that would change every contrast check and panel suggestion app-wide to fix one consumer.
- **Darken or lighten the sheet colour instead:** the sheet would no longer match the page's background, which the spec and `general-guest-screen-fallbacks.md` define.

## Consequences
On mid-grey sheets the body text is `#000000`, not the `#111111` used elsewhere. The version line at 70% opacity can still fall below 4.5:1, as before.
