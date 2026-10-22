---
title: "T-015: Fields and Connect button panels"
type: ticket
project: captivator
status: done
priority: P0
milestone: 3
estimate: 15
depends_on: [T-008, T-010]
touches:
  - src/editor/panels/FieldsPanel.tsx
  - src/editor/panels/ButtonPanel.tsx
  - src/editor/panels/FieldsPanel.test.tsx
  - src/editor/panels/ButtonPanel.test.tsx
  - src/editor/controls/useRequiredDraft.ts
  - src/editor/controls/useRequiredDraft.test.ts
  - src/editor/panels/ImagePanel.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-015: Fields and Connect button panels

## Context
Build step 3, brief items "add up to two of Name, Email and Phone" and "set the Connect button's colours" ([spec → Editor UI → Inspector panels → Fields, Connect button](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md), *Limits*). This replaces the `FieldsPanel` and `ButtonPanel` stubs from T-008. No artboard draws these panels; match the panel styling on `Main`. Decisions: [`T-015-fields-and-button-panels-one-ticket.md`](../decisions/T-015-fields-and-button-panels-one-ticket.md), [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md), [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md).

## Scope
- **`FieldsPanel()`:**
  - Three `<label>` + checkbox rows (Name, Email, Phone). Ticking appends the kind to `form.fields`; unticking removes it (`updateForm({ fields })`).
  - When two are ticked, the third is disabled, with "Up to two fields. Untick one to choose another."
  - With none ticked, the note "No fields: guests just tap Connect."
  - `ColourField`s for "Input background" (`inputBg`) and "Input text" (`inputText`).
- **`ButtonPanel()`:**
  - Label input (`maxLength` 24, counter "{n} of 24"). Keep a local draft and dispatch only non-empty values, showing "Required" while empty.
  - `ColourField`s "Button colour" (`bg`: the fill, or the border when outline) and "Text colour" (`fg`).
  - `Segmented` Solid / Outline (`variant`).
- **Out of scope:** the renderer's input and button styles (T-007).

## Acceptance criteria
- [x] A third field can't be added: its checkbox is disabled once two are ticked (spec checklist).
- [x] Field order in the preview follows tick order.
- [x] Input and button colour changes show live in the preview.
- [x] Clearing the button label shows "Required" and leaves the stored label unchanged.
- [x] All controls are labelled, keyboard-reachable, with at least 44px tap targets. *Tab order is tested through every control; the 44px targets are checked from the classes, since jsdom can't measure.*
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the two stubs and `Segmented`.
- T-010: `ColourField`.

## Outcome
- **Built:** the Fields panel (Name / Email / Phone checkboxes in tick order, capped at two, with one live note and the input colours) and the Connect button panel (label with a 24-character counter and a "Required" guard, button and text colours, Solid / Outline). 526 tests pass; `tsc` and lint are clean.
- **Review:** changes required for one must-fix: the keyboard test stopped halfway. It now tabs through every control and out of the panel. The should-fix moved the required-text draft into a shared `useRequiredDraft` hook, now used by this panel and the Image panel ([`T-015-required-draft-hook.md`](../decisions/T-015-required-draft-hook.md)). The nits were fixed too ([`T-015-panel-focus-ring-blue-600.md`](../decisions/T-015-panel-focus-ring-blue-600.md)). The re-review approved (`c3372f0`).
- **Milestone 3 review:** done, nothing missing; this record closes milestone 3.
- **Security:** not a trust-boundary ticket; no audit run.

## Notes
- **Contrast feedback for the button colours:** per `T-013-panels-show-contrast-line.md`, only the Text and Terms panels show a contrast line; T-027's line under the preview covers the button and inputs. Giving these panels their own line would need a decision that supersedes T-013's scope.
- **ColourField's focus ring** is still `#2563EB`, the one editor control not on `blue-600` (`ColourField.tsx` is T-010's).

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md): An outline Connect button uses bg as its border and fg as its text
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-015-fields-and-button-panels-one-ticket.md`](../decisions/T-015-fields-and-button-panels-one-ticket.md): The Fields and Connect button panels are one ticket
- [`T-015-panel-test-files-added.md`](../decisions/T-015-panel-test-files-added.md): adds the two panel test files
- [`T-015-fields-note-live-region.md`](../decisions/T-015-fields-note-live-region.md): one live note describes the disabled checkbox
- [`T-015-button-label-draft-rules.md`](../decisions/T-015-button-label-draft-rules.md): the label draft follows the alt text rules
- [`T-015-required-draft-hook.md`](../decisions/T-015-required-draft-hook.md): one `useRequiredDraft` hook for required text inputs
- [`T-015-panel-focus-ring-blue-600.md`](../decisions/T-015-panel-focus-ring-blue-600.md): the panels' focus ring is `blue-600`
