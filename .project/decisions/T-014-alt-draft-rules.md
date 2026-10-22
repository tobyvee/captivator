---
title: "The Image panel treats spaces-only alt text as empty and resyncs its draft when the stored alt changes"
type: decision
project: captivator
ticket: T-014
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility, undo]
---
# The Image panel treats spaces-only alt text as empty and resyncs its draft when the stored alt changes

## Context
The ticket says to keep a local alt draft and dispatch only "when it's non-empty" (`T-004-store-rejects-invalid-designs.md`). The schema's `min(1)` accepts a single space, which describes nothing. Undo (T-025) can also change the stored alt while the panel is mounted, which would leave a local draft stale.

## Decision
- The draft counts as empty when `trim()` is empty: it shows "Describe the image", sets `aria-invalid` and doesn't dispatch. A non-empty draft is dispatched as typed, untrimmed, so spaces between words survive typing.
- The draft follows the stored alt whenever the stored value changes (state adjusted during render, not an effect). Clearing the input doesn't change the store, so it doesn't reset the draft.

## Alternatives
- **Only check `length > 0`:** a single space would be saved as the image's description.
- **Trim before dispatching:** typing "Harbour logo" would lose its space at "Harbour ".
- **Ignore outside changes:** after undo, the input would show text the design no longer holds.

## Consequences
T-025 needs nothing extra for the Image panel: undoing an alt edit updates the input.
