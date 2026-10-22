---
title: "The Text and Terms panels keep their own contrast markup but share one rating helper, rateText, in readability.ts"
type: decision
project: captivator
ticket: [T-020, T-013]
decided_by: main session
supersedes: T-020-contrast-line-and-wording-markup.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast]
---
# The Text and Terms panels keep their own contrast markup but share one rating helper, rateText, in readability.ts

## Context
`T-020-contrast-line-and-wording-markup.md` gave the Terms panel its own `ContrastLine`, because TextPanel's box layout and copy differ. The T-020 code review found that this covered the markup, but the rating itself (photo never rated, gradient's worse stop, `requiredRatio`, pass on the unrounded ratio) was now copied line for line in both panels. The terms row's 14px/400 was also written in three places (`Form.tsx`, `readability.ts`, `TermsPanel.tsx`).

## Decision
- `src/lib/readability.ts` exports `rateText(colour, size, weight, background)`, returning `{ kind: "photo" }` or `{ kind: "pass" | "fail", ratio, required }`, with tests, and `TERMS_TEXT` (`{ size: 14, weight: 400 }`). Both panels call `rateText`; the Terms panel and `checkDesign` read `TERMS_TEXT`.
- Each panel keeps its own markup and copy, as before: the Text panel's green or amber box, and the Terms panel's single line with only the verdict live. The rest of the superseded decision stands: the shared `WordingInput`, the named drafts, and no counters on the wording inputs.
- The wording inputs sit in a `fieldset` with the legend "Checkbox wording", matching FieldsPanel's grouping, and the sample uses the guest row's 14px text and 20px box.

## Alternatives
- **One shared ContrastLine component:** needs props for two layouts and two sets of copy; the rule is what has to agree, not the look.
- **Export the size from `Form.tsx`:** T-022 owns `Form.tsx` in the next wave; `Form.tsx` can import `TERMS_TEXT` later if wanted.

## Consequences
`TextPanel.tsx` (T-013, done) changed to call `rateText`; no open ticket claims it. A change to the rating rule now lands in one tested function. `Form.tsx` still writes 14px itself.
