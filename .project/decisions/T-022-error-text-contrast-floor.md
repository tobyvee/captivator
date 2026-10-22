---
title: "Error message text falls back to the page's readable text colour when neither red reaches 4.5:1; the red stays on the border, outline and icon"
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, contrast, accessibility]
---
# Error message text falls back to the page's readable text colour when neither red reaches 4.5:1; the red stays on the border, outline and icon

## Context
T-022 splash audit. The ticket colours the error messages with `bestErrorColour(backgroundColours(background))`, which picks the better of `#FECACA` and `#B91C1C` without a floor. On mid-tone pages (`#777777`, `#2563EB`, `#F97316`) neither reaches 4.5:1, so the 14px/500 messages fail WCAG AA.

## Decision
`Form.tsx` resolves two colours for the Error screen:
- **Mark:** `bestErrorColour(page)`, for the input's 2px border, the checkbox outline and the message icon.
- **Text:** the mark when its worst ratio on the page reaches 4.5:1. Otherwise it's `readableTextColour(page)`, a new helper in `src/lib/contrast.ts`. That helper is `bestTextColour` when it reaches 4.5:1, otherwise pure black when black reads better (`T-021-sheet-text-black-fallback.md`).

On mid-tones the message is then identified as an error by its icon, `aria-invalid`/`aria-describedby` and the red border or outline, not by the colour of its text. `TermsSheet`'s text colour uses the same helper for its fallback, with byte-identical output.

## Alternatives
- **`bestTextColour(page)` alone:** still fails on mid-greys (white reaches 4.48:1 on `#777777`).
- **Add a darker or lighter red per page:** the colour is then computed, not a fixed pair, and it still fails on some mid-tones.
- **Change `bestErrorColour` itself:** the editor's checks and suggestions use it as a colour pair, not as a text colour.

## Consequences
On mid-tones the message text isn't red. On a two-stop gradient whose stops need opposite text colours, nothing may reach 4.5:1; the helper then returns the better of the two. Photo pages use the backdrop and overlay, which is approximate (`general-photo-contrast-approximate.md`).
