---
title: "The Background panel's tab is local state that resyncs whenever the stored background's type changes"
type: decision
project: captivator
ticket: T-016
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, background]
---
# The Background panel's tab is local state that resyncs whenever the stored background's type changes

## Context
T-016 keeps the selected tab in local state, defaulting to the background's `type`, because the Photo tab can be open with no photo stored yet. But the background can change while the panel stays mounted: undo and redo, or a template switch. A tab left on Gradient over a restored colour background would show controls for a type that isn't stored.

## Decision
The panel remembers the background type it last saw. When the stored type differs, it sets the tab to match during render (React's "adjust state when a prop changes" pattern). Choosing Photo without a photo doesn't change the stored type, so the tab stays on Photo. Each tab's controls render only when the stored type matches, so a mismatch can never write the wrong shape.

## Alternatives
- **Derive the tab from the store only:** Photo couldn't be opened before a photo exists.
- **A `useEffect` that syncs the tab:** renders one frame with the wrong tab, and the React lint rules discourage setting state in effects.
- **Key the panel on the background type in `Inspector.tsx`:** outside this ticket's `touches`.

## Consequences
Undo after a tab switch moves the tab back with the background. An open Photo tab with no photo returns to the stored type only when that type changes.
