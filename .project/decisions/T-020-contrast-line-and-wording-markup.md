---
title: "The Terms panel keeps its own one-line contrast verdict and a local WordingInput for its two required inputs"
type: decision
project: captivator
ticket: T-020
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast, terms]
---
# The Terms panel keeps its own one-line contrast verdict and a local WordingInput for its two required inputs

## Context
`T-013-contrast-verdict-live-region.md` says T-020 can reuse the Text panel's contrast pattern, but `TextPanel.tsx`'s `ContrastLine` takes a text block, isn't exported, and is outside T-020's `touches`. The ticket's copy ("Easy to read: {r} on the background", "Hard to read: {r}, needs 4.5:1") differs from the Text panel's, and the `EditorTerms` artboard draws it as a single icon line under the colour field, not a box. `T-015-required-draft-hook.md` keeps the required-input markup in each panel; this panel has two identical wording inputs.

## Decision
- `TermsPanel.tsx` has its own `ContrastLine`: one line with a check or warning icon, green when passing and amber (`#92400E`) when failing or over a photo. Only the verdict words sit in an always-mounted `role="status"` span; the ratio after it isn't live. The ratio needed comes from `requiredRatio(14, 400)`, the guest row's size and weight. Over a photo it shows only "Check readability over your photo" (`T-013-photo-line-never-rates.md`).
- The two wording inputs share a module-local `WordingInput` that writes the T-015 markup (`aria-invalid`, the error id in `aria-describedby` only while missing, an always-mounted `role="alert"` "Required"). The hooks are still called and named in `TermsPanel` (`label`, `linkText`, `body`). The wording inputs have no counter, since the ticket gives none; the body's "{n} of 8,000" counter and hint are always in its description.

## Alternatives
- **Export and generalise TextPanel's `ContrastLine`:** outside `touches`, and its box and wording don't match this panel's canvas or copy.
- **Write the wording markup out twice:** two identical copies in one file.

## Consequences
Two contrast-line styles exist (Text panel box, Terms panel line). If one shared control is wanted later, it needs props for the copy and layout.
