---
title: "The Fields panel's limit and no-fields notes share one always-mounted status region, which describes the disabled checkbox"
type: decision
project: captivator
ticket: T-015
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The Fields panel's limit and no-fields notes share one always-mounted status region, which describes the disabled checkbox

## Context
T-015 asks for the third checkbox to be disabled once two are ticked, with "Up to two fields. Untick one to choose another.", and for "No fields: guests just tap Connect." when none are ticked. It doesn't say how either is announced. A disabled checkbox drops out of the Tab order, so a keyboard user who ticks the second field would never hear why the third went quiet. The three checkboxes also need a group name.

## Decision
- One `<p role="status">` is always mounted under the checkboxes and holds whichever note applies (none with one field). Ticking the second field or unticking the last one is announced politely. When empty, `empty:-mt-1.5` cancels the gap, as in `T-014-alt-error-live-region.md`.
- The disabled checkbox's `aria-describedby` points at that note, so browsing to it explains why.
- The checkboxes sit in a `<fieldset>` with a visually hidden `<legend>` "Fields"; the Inspector heading already shows "Fields".
- Each checkbox's text comes from `FIELD_SPEC[kind].placeholder`, in `FieldKind.options` order (Name, Email, Phone). The design stores only the kinds.
- The Input background and Input text colours stay visible with no fields ticked, so they can be set before a field is added.

## Alternatives
- **`aria-disabled` instead of `disabled`, keeping the box focusable:** the ticket and spec say "disabled", and the store's schema guard would become the only thing refusing the click.
- **`role="alert"`:** reaching the limit isn't an error, so an assertive announcement is too loud.
- **A visible legend such as "Ask guests for":** invented copy that repeats the heading.

## Consequences
The panel has one live region. Tests find the notes through `getByRole("status")`.
