---
title: "T-034: Drag to reorder blocks with dnd-kit"
type: ticket
project: captivator
status: todo
priority: P2
milestone: 8
estimate: 15
depends_on: [T-012]
touches:
  - src/editor/BlockList.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-034: Drag to reorder blocks with dnd-kit

## Context
Stretch, scheduled at P2 ([`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md); [spec → Build plan → Stretch](../spec/Captivator%20MVP%20%E2%80%94%20Tech%20Spec.md); *Editor UI → Block list*: "drag handles come with the @dnd-kit stretch work"). It's not in the cut order, so it has no `cut_rank`. `@dnd-kit/*` is already installed by T-001. Canvas artboard: `Main` (drag handles on block rows).

## Scope
- In `BlockList.tsx`:
  - Wrap zone 2's rows in `DndContext` + `SortableContext` (`verticalListSortingStrategy`), with a pointer sensor and a keyboard sensor.
  - Each row gets a drag handle `<button aria-label="Drag to reorder {name}">` (lucide `GripVertical`).
  - On drag end, move the block from index i to j by calling `moveBlock(id, ±1)` |j − i| times. The undo debounce groups these into one step; don't add a store action.
- Keep the up/down buttons. Change the tip to "Tip: tap anything in the preview to edit it. Drag blocks to reorder."
- **Out of scope:** dragging Background, Fields, Terms or Connect (pinned by the schema's shape).

## Acceptance criteria
- [ ] Dragging a row reorders the blocks in the preview; keyboard dragging (Space, arrows, Space) works and is announced.
- [ ] Pinned rows can't be dragged.
- [ ] Up/down buttons still work.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-012: `BlockList.tsx`, which this ticket extends.

## Notes
- **From T-012:** put the drag handle inside each block row's wrapper, beside the select button (the row's `controls` slot), and keep the up/down buttons for keyboard users ([`T-012-row-controls-focus-left-to-react.md`](../decisions/T-012-row-controls-focus-left-to-react.md)). Add "Drag blocks to reorder." back to the tip, and put the tests in `src/editor/BlockList.test.tsx`.

## Decisions
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
