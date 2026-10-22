---
title: "FocusGrid renders the drag help line itself, and T-033's tests extend PhotoAdjustments.test.tsx"
type: decision
project: captivator
ticket: [T-033, T-017]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# FocusGrid renders the drag help line itself, and T-033's tests extend PhotoAdjustments.test.tsx

## Context
T-033 adds the help line "Drag the dot for fine control, or tap a square.", which the `DesktopPreview` artboard puts under the focus box. Its `touches` lists only `FocusGrid.tsx`, while the panel's other help text lives in `PhotoAdjustments.tsx`. The ticket's Notes and `T-017-panel-test-file-added.md` say T-033 extends `PhotoAdjustments.test.tsx`, which isn't in `touches` either.

## Decision
- **Help line:** FocusGrid returns the box and the help line as siblings (a fragment), so they take the panel column's 8px gap as the canvas draws them. The line describes the dot (`aria-describedby`); the grid stays described by PhotoAdjustments' "Tap the part of the photo…" line. `FocusGrid`'s props are unchanged.
- **Tests:** `src/editor/panels/PhotoAdjustments.test.tsx` grows from 15 to 20 cases, as the ticket's Notes direct. The preset case also checks the dot follows the tap; the new cases cover a 2-second drag through the store moves the focus live and is one undo step; the dot's label, position and description; drag rounding, clamping and release; moves that didn't start on the dot with the main button; and arrow keys with clamping and the announcement.

## Alternatives
- **The help line in PhotoAdjustments:** outside `touches`, and it belongs to the dot.
- **A new `FocusGrid.test.tsx`:** splits FocusGrid's cases across two files when the existing file already holds them.

## Consequences
Any caller of FocusGrid gets the drag help line. PhotoAdjustments.test.tsx stubs `HTMLElement.prototype.setPointerCapture`, which jsdom lacks.
