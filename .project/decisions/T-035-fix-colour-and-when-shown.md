---
title: "The Fix picks readableTextColour against the colours checkDesign used, and only shows when it would change the colour"
type: decision
project: captivator
ticket: T-035
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast]
---
# The Fix picks readableTextColour against the colours checkDesign used, and only shows when it would change the colour

## Context
The ticket says each Fix sets `bestTextColour(backgroundColours(bg, photoAverage))`. Three things don't fit that wording:
- `checkDesign` also rates text on a fitted photo's backdrop (`T-027-fitted-photo-checks-backdrop.md`), so a colour picked on the photo's average alone can leave the failure in place. With a white backdrop around a dark photo, the average-only pick is white, the colour that is already failing.
- On mid-tones `bestTextColour` can fall short of 4.5:1 where pure black passes. `readableTextColour` already handles this (`T-021-sheet-text-black-fallback.md`). It returns the same colour as `bestTextColour` whenever that reaches 4.5:1, so white on white still becomes `#111111`.
- When the best pick is the colour the text already has (black-to-white gradient, for example), the button would do nothing.

## Decision
- The Fix rates against the same colours as `checkDesign`: `backgroundColours(bg, photoAverage)`, plus the backdrop for a fitted photo with a known average. This is rebuilt in `ReadabilityCheck.tsx`, because `readability.ts` is T-027's file.
- It uses `readableTextColour`, not `bestTextColour`.
- The Fix button only shows when that colour differs from the current one. "Fields" (the inputs' edge) never has a Fix (`T-027-input-edge-contrast.md`).
- The button's visible text is "Fix". Its accessible name is "Fix {label}", e.g. "Fix Heading", so a screen reader user knows what it changes. The name still starts with the visible word, so speech input works (WCAG 2.5.3).

## Alternatives
- **`bestTextColour` on the average alone, as worded:** can leave a fitted photo's failure in place and can stop short of 4.5:1 on mid-tones.
- **Export the page colours from `readability.ts`:** the ticket puts that file out of scope.
- **Always show Fix:** sometimes it would do nothing.

## Consequences
- If `checkDesign` changes how it builds the page colours, the copy in `fixFor` has to change with it.
- A Fix can still leave a failure when no colour reads on every stop, for example a black-to-white gradient. It only shows when it improves on the current colour, and the line keeps warning.
