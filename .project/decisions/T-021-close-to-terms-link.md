---
title: "The export's close links and dim layer target #cv-terms-link, not #"
type: decision
project: captivator
ticket: [T-021, T-022, T-023]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, export, terms, accessibility]
---
# The export's close links and dim layer target #cv-terms-link, not #

## Context
The T-021 ticket gave the export's × and CLOSE `href="#"`. The T-021 splash audit found that `#` clears `:target` but scrolls the guest to the top of the page and drops focus there, away from the terms checkbox they were about to tick. The export's dim layer was plain markup, so tapping outside the sheet did nothing in the export but closed it in the preview (`T-021-dim-layer-closes-sheet.md`).

## Decision
`TermsSheet.tsx` exports `TERMS_LINK_ID = "cv-terms-link"`. In the export, ×, CLOSE and the dim layer are links to `#cv-terms-link`. The dim layer is `<a aria-hidden="true" tabindex="-1">`, so it stays out of the tab order and the accessibility tree. T-022 owns `Form.tsx` and will import the constant and set it as the `id` of the export's terms link. Closing then moves the guest and focus back to that link. Until then the fragment matches nothing, which still clears `:target` and doesn't scroll.

## Alternatives
- **Keep `#`:** scrolls to the top and loses the guest's place.
- **`#cv-root` or another landmark:** clears `:target`, but focus lands away from the checkbox.
- **Edit `Form.tsx` here:** T-022 owns it, and its ticket is open.

## Consequences
T-022 must add `id={TERMS_LINK_ID}` to the export terms link. That makes `Form.tsx` and `TermsSheet.tsx` import each other, because TermsSheet uses `connectButtonStyle`. Both values are read only during render, so the cycle is safe in ESM. If it becomes a problem, move the shared values to a small module of their own. T-023's `<style>` is unaffected: it still keys on `.cv-terms:target`.
