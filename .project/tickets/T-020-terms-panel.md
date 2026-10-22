---
title: "T-020: Terms panel"
type: ticket
project: captivator
status: done
priority: P1
milestone: 6
estimate: 15
depends_on: [T-003, T-008, T-010]
touches:
  - src/editor/panels/TermsPanel.tsx
  - src/editor/panels/TermsPanel.test.tsx
  - src/editor/panels/TextPanel.tsx
  - src/lib/readability.ts
  - src/lib/readability.test.ts
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-020: Terms panel

## Context
Build step 6, "Terms row and panel" ([spec → Editor UI → Inspector panels → Terms](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Limits*; PRD *Terms editing*). This replaces the `TermsPanel` stub from T-008. The on/off switch is in the Inspector header (T-008) and the block list (T-012). Selecting Terms already switches the preview to the sheet (store rule in T-004). Canvas artboard: `EditorTerms` (`project/EditorTerms.dc.html`). Decisions: [`T-013-panels-show-contrast-line.md`](../decisions/T-013-panels-show-contrast-line.md), [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md), [`T-004-terms-selection-switches-screen.md`](../decisions/T-004-terms-selection-switches-screen.md).

## Scope
`TermsPanel()` dispatches `updateForm({ terms: { … } })`. Sections:
- **Checkbox wording:**
  - "Before the link" input (`maxLength` 60) and "Link text" input (`maxLength` 30). Both are required: keep local drafts, dispatch only non-empty values, show "Required" while empty.
  - A live sample: an unticked, disabled checkbox plus "{label} {linkText}" styled as a link, captioned "How guests see it. The box always starts unticked."
- **Terms text:**
  - `<textarea>` (`maxLength` 8000, required draft) with the counter "{n} of 8,000".
  - Help text: "Type or paste your terms. A blank line starts a new paragraph. They open inside the login page, because guests are not online yet and links to websites would not load."
- **Checkbox text colour:** `ColourField` (`terms.textColour`) with a contrast line (14px, weight 400 → needs 4.5:1): "Easy to read: {r} on the background", "Hard to read: {r}, needs 4.5:1", or "Check readability over your photo".
- **Version:** "Version {n}" with "Changing the text after you publish starts a new version, so you can tell which terms each guest agreed to." The MVP has no publish step, so `version` isn't bumped.
- **Marketing reminder:** "Collecting emails for marketing? That needs its own opt-in. It can't share this checkbox."
- When `mode === "off"`: keep the wording editable and show "Terms are off. Turn them on with the switch above to show the checkbox."
- **Out of scope:** the switch (T-008, T-012); the sheet's rendering (T-021).

## Acceptance criteria
- [x] Editing either wording field updates the preview's terms row and the live sample on each keystroke.
- [x] The body textarea stops at 8,000 characters with a live counter, and blank lines become paragraphs in the Terms sheet once T-021 lands.
- [x] Emptying a required field shows "Required" and keeps the last stored value.
- [x] No rich text: the body is a plain textarea.
- [x] All controls are labelled and keyboard-reachable, with at least 44px tap targets.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-003: contrast helpers for the colour line.
- T-008: the stub and the Inspector header that holds the switch.
- T-010: `ColourField`.

## Outcome
- **Built:** the Terms panel replacing the T-008 stub: "Before the link" and "Link text" wording inputs with required drafts, a live sample (a disabled, never-ticked checkbox showing the stored wording on the page's colours), the terms text with an "{n} of 8,000" counter, the checkbox text colour with a one-line contrast verdict, the version note and the marketing opt-in reminder. With terms off, a note says how to turn them on and the wording stays editable. 617 tests pass; `tsc` and lint are clean.
- **Review:** approved with three should-fixes, all fixed in `abd3923`. The Text and Terms panels now share one tested `rateText` helper, and the terms row's size comes from `TERMS_TEXT` in `readability.ts` ([`T-020-panels-share-rate-text.md`](../decisions/T-020-panels-share-rate-text.md)). The gradient test covers both directions. The nits were taken too: the wording inputs are a `fieldset`, the sample uses the guest row's 14px text and 20px box, and the test's sample helper asserts it found one.
- **Security:** not a trust-boundary ticket; the wave audit covers it.

## Notes
- **From T-015:** use `useRequiredDraft(stored, commit)` from `src/editor/controls/useRequiredDraft.ts` for each required wording input and the body textarea, with the same `aria-invalid`, describedby and always-mounted `role="alert"` markup as the Button and Image panels ([`T-015-required-draft-hook.md`](../decisions/T-015-required-draft-hook.md)). Naming each result (`const label = useRequiredDraft(...)`) reads better than destructuring three times.
- **From T-013:** the contrast line's live verdict and amber style ([`T-013-contrast-verdict-live-region.md`](../decisions/T-013-contrast-verdict-live-region.md)).

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-004-terms-selection-switches-screen.md`](../decisions/T-004-terms-selection-switches-screen.md): Selecting Terms switches the preview to the Terms sheet, in the store
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-013-panels-show-contrast-line.md`](../decisions/T-013-panels-show-contrast-line.md): The Text and Terms panels show a per-item contrast line
- [`T-015-required-draft-hook.md`](../decisions/T-015-required-draft-hook.md): required wording inputs use `useRequiredDraft`
- [`T-020-panel-test-file-added.md`](../decisions/T-020-panel-test-file-added.md): adds `TermsPanel.test.tsx`
- [`T-020-sample-stored-wording-on-page-colours.md`](../decisions/T-020-sample-stored-wording-on-page-colours.md): the sample shows the stored wording on the page's colours
- [`T-020-contrast-line-and-wording-markup.md`](../decisions/T-020-contrast-line-and-wording-markup.md): the panel's own contrast line and wording markup (superseded)
- [`T-020-panels-share-rate-text.md`](../decisions/T-020-panels-share-rate-text.md): the same markup, with one shared `rateText` rating
