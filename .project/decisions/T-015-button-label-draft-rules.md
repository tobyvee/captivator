---
title: "The Connect button's label draft follows the Image panel's alt rules: spaces-only counts as empty, and the draft resyncs on outside changes"
type: decision
project: captivator
ticket: T-015
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility, undo]
---
# The Connect button's label draft follows the Image panel's alt rules: spaces-only counts as empty, and the draft resyncs on outside changes

## Context
T-015 says to keep a local label draft, dispatch only non-empty values and show "Required" while empty (`T-004-store-rejects-invalid-designs.md`). The schema's `min(1)` accepts a single space, which would render a blank Connect button. Undo (T-025) or a template switch can change the stored label while the panel is mounted. The ticket also doesn't say how "Required" is announced.

## Decision
The same rules as `T-014-alt-draft-rules.md` and `T-014-alt-error-live-region.md`:
- A draft whose `trim()` is empty shows "Required", sets `aria-invalid` and isn't dispatched. Anything else is dispatched as typed, untrimmed.
- The draft follows the stored label whenever that changes (state adjusted during render, not an effect).
- "Required" sits in an always-mounted `role="alert"` paragraph, added to `aria-describedby` only while shown. The "{n} of 24" counter counts the draft and is always in `aria-describedby`.

## Alternatives
- **Check `length > 0` only:** a single space would be saved as the button's label.
- **Trim before dispatching:** "Get online" would lose its space while being typed.
- **Swap the counter for "Required":** not announced while typing, and the count is still useful.

## Consequences
T-025 needs nothing extra for this panel. The Terms panel (T-020) can follow the same pattern for its wording inputs.
