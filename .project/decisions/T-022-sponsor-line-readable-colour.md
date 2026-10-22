---
title: "Connected's sponsor line uses readableTextColour; the shared main colour and column rules stand, and BackgroundPanel now shares the helper"
type: decision
project: captivator
ticket: T-022
decided_by: main session
supersedes: T-022-shared-main-colour-and-column.md
updated: 2026-10-23
tags: [project, captivator, decision, splash, contrast]
---
# Connected's sponsor line uses readableTextColour; the shared main colour and column rules stand, and BackgroundPanel now shares the helper

## Context
`T-022-shared-main-colour-and-column.md` kept "Thanks to our sponsor" in `bestTextColour`. The nextjs-specialist's fix report noted it is 4.48:1 on `#777777`, under the 4.5:1 its 15px/500 text needs, and `c39ee59` switched it to `readableTextColour`, the floor the error messages use (`T-022-error-text-contrast-floor.md`). The same commit made `BackgroundPanel.tsx` use the shared helper. The re-review asked for a superseding file so the log matches the code.

## Decision
- "Thanks to our sponsor" is 15px/500 in `readableTextColour(backgroundColours(background))`.
- Unchanged from the superseded file: `mainBackgroundColour(bg)` in `src/lib/contrast.ts` is the one main-colour rule, now used by `TermsSheet.tsx`, `Connected.tsx` and `BackgroundPanel.tsx`; `COLUMN` lives in `src/splash/layout.ts`; the heading reads "You're online" in sentence case; CONTINUE adds no margin to the column's gap.

## Alternatives
- **Keep `bestTextColour`:** falls short of 4.5:1 on mid-greys.

## Consequences
No copies of the main-colour rule remain. On a two-stop gradient whose ends need opposite text colours, no colour reaches 4.5:1 on both, as for the error messages.
