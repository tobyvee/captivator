---
title: "Each readability failure carries the colours it was rated against, and the Fix shows only when its colour reads better on them"
type: decision
project: captivator
ticket: [T-035, T-027]
decided_by: nextjs-specialist
supersedes: T-035-fix-colour-and-when-shown.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast]
---
# Each readability failure carries the colours it was rated against, and the Fix shows only when its colour reads better on them

## Context
T-035's code review found two problems with `T-035-fix-colour-and-when-shown.md`:
- **The Fix could make text harder to read.** It showed whenever the picked colour differed from the current one. `readableTextColour` only picks near-black, white or black. On a page with several colours (a gradient, a two-stop overlay, a fitted photo and its backdrop), all three can read worse than the current colour. Body text in #777777 on a black-to-white gradient reads at 4.48:1, and the Fix set it to #111111, which reads at 1.11:1.
- **`fixFor` kept a copy of how `checkDesign` builds the page colours**, a fitted photo's backdrop included. The two could drift apart.

T-035 put `readability.ts` out of scope. That only kept parallel agents from editing the file while T-027 was open. T-027 has landed, and no open ticket owns the file now.

## Decision
- `ReadabilityFailure` gains `against: string[]`, the colours the check rated the text on:
  - the page colours (a fitted photo's backdrop included) for text blocks, the terms row, an outline button's label and the inputs' edge;
  - `[button.bg]` for a solid button's label;
  - `[inputBg]` for the field text.
- `fixFor` picks `readableTextColour(failure.against)` and only builds the store patch for the failure's target. It no longer rebuilds the page colours.

These rules from the superseded decision still apply, restated:
- The Fix uses `readableTextColour`, not `bestTextColour`. It is the same pick wherever that reaches 4.5:1, and black on mid-tones where it doesn't (`T-021-sheet-text-black-fallback.md`).
- The Fix is offered only when it helps. That now means the picked colour's worst ratio on `against` must be higher than the failure's current ratio. This also covers a pick equal to the current colour, which the old rule checked separately.
- "Fields" (the inputs' edge) never has a Fix (`T-027-input-edge-contrast.md`).
- The button's accessible name is "Fix {label}", e.g. "Fix Heading".

## Alternatives
- **Keep the copy of the page colours in `fixFor`:** it was the source of the drift risk the review flagged.
- **Export a `pageColours(bg, photoAverage)` helper from `readability.ts`:** this removes the copy for page text, but `fixFor` would still need to know which ground each target sits on (button fill, field, page). `checkDesign` already knows this.
- **Compare against `required` instead of the current ratio, offering the Fix only when it passes:** this would hide a Fix that helps without fully passing. One case is the fitted-photo heading that goes from 1.0:1 to 1.6:1.

## Consequences
- Anything that reads `checkDesign`'s failures gets `against` as well. A new check must set it to the ground its text is rated on.
- A Fix can still leave a failure in place when no colour reads on every colour in `against`. The line keeps warning after the Fix, and the Fix button goes away.
