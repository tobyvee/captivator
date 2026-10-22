---
title: "T-015: Fields and Connect button panels"
type: ticket
project: captivator
status: todo
priority: P0
milestone: 3
estimate: 15
depends_on: [T-008, T-010]
touches:
  - src/editor/panels/FieldsPanel.tsx
  - src/editor/panels/ButtonPanel.tsx
cut_rank:
updated: 2026-10-22
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
- [ ] A third field can't be added: its checkbox is disabled once two are ticked (spec checklist).
- [ ] Field order in the preview follows tick order.
- [ ] Input and button colour changes show live in the preview.
- [ ] Clearing the button label shows "Required" and leaves the stored label unchanged.
- [ ] All controls are labelled, keyboard-reachable, with at least 44px tap targets.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-008: the two stubs and `Segmented`.
- T-010: `ColourField`.

## Decisions
- [`T-004-store-rejects-invalid-designs.md`](../decisions/T-004-store-rejects-invalid-designs.md): Store actions drop any update that would make the design fail the schema
- [`T-007-outline-button-colours.md`](../decisions/T-007-outline-button-colours.md): An outline Connect button uses bg as its border and fg as its text
- [`T-008-editor-shell-creates-slots.md`](../decisions/T-008-editor-shell-creates-slots.md): The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub
- [`T-015-fields-and-button-panels-one-ticket.md`](../decisions/T-015-fields-and-button-panels-one-ticket.md): The Fields and Connect button panels are one ticket
