---
title: "T-034: Drag to reorder blocks with dnd-kit"
type: ticket
project: captivator
status: done
priority: P2
milestone: 8
estimate: 15
depends_on: [T-012]
touches:
  - src/editor/BlockList.tsx
  - src/editor/BlockList.test.tsx
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
- [x] Dragging a row reorders the blocks in the preview; keyboard dragging (Space, arrows, Space) works and is announced.
- [x] Pinned rows can't be dragged.
- [x] Up/down buttons still work.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Dependencies
- T-012: `BlockList.tsx`, which this ticket extends.

## Outcome
- **Built:** zone 2's block rows are sortable with dnd-kit (pointer sensor with a 4px threshold, keyboard sensor, vertical-only). Each block row leads with a 44px "Drag to reorder {name}" handle, as the `Main` artboard draws it; pinned rows have none and a lone block's handle is disabled. A drop calls `moveBlock` once per place moved, so it's one undo step and every step passes the schema. Announcements name the block and its position. The up/down buttons are unchanged and the tip now says "Drag blocks to reorder." 874 tests pass; `tsc`, lint and `vite build` are clean.
- **Review:** changes required for one test: the tap test passed without the 4px threshold it claimed to check. Fixed in `3df6b84` with a test that a 2px wobble doesn't start a drag and a 10px move does; it fails without the threshold. The review's note that the summary also loses 44px is logged in [`T-034-summary-width-cost.md`](../decisions/T-034-summary-width-cost.md).
- **Milestone 8 review:** ready to close; nothing missing and no rule broken.
- **Security:** not a trust-boundary ticket; the wave audit covers it.

## Notes
- **Review nits left as they are:** the announcement's `lastOver` lives in a `useMemo` closure rather than a ref; the 60ms wait after each drag test is only needed after the pointer drop.
- **Screen readers** call the handle "sortable" rather than "button": dnd-kit spreads `aria-roledescription="sortable"` onto it, its standard behaviour.
- **Tests:** jsdom has no layout, so the drag tests stack the rows 50px apart; after a pointer drop dnd-kit swallows clicks for 50ms, which the tests wait out.
- **From T-012:** put the drag handle inside each block row's wrapper, beside the select button (the row's `controls` slot), and keep the up/down buttons for keyboard users ([`T-012-row-controls-focus-left-to-react.md`](../decisions/T-012-row-controls-focus-left-to-react.md)). Add "Drag blocks to reorder." back to the tip, and put the tests in `src/editor/BlockList.test.tsx`.

## Decisions
- [`general-stretch-tickets-scheduled.md`](../decisions/general-stretch-tickets-scheduled.md): Stretch tickets are scheduled, not held until the build is ahead
- [`T-034-drag-handle-leads-the-row.md`](../decisions/T-034-drag-handle-leads-the-row.md): the handle leads the row, in a new `leading` slot
- [`T-034-drag-behaviour-details.md`](../decisions/T-034-drag-behaviour-details.md): announcements, the 4px threshold, vertical-only and the lone-block handle
- [`T-034-summary-width-cost.md`](../decisions/T-034-summary-width-cost.md): the summary's lost 44px is accepted
- [`T-012-row-controls-focus-left-to-react.md`](../decisions/T-012-row-controls-focus-left-to-react.md): row controls sit beside the select button
- [`general-undo-leading-edge-debounce.md`](../decisions/general-undo-leading-edge-debounce.md): a drop within 400ms of another edit joins its undo step
