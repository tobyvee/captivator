---
title: "Block drag announces by name and position, needs 4px of pointer travel, moves vertically only and is disabled for a lone block"
type: decision
project: captivator
ticket: T-034
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Block drag announces by name and position, needs 4px of pointer travel, moves vertically only and is disabled for a lone block

## Context
T-034 asks for pointer and keyboard sensors and for keyboard dragging to be "announced", but leaves the details open. dnd-kit's default announcements read the raw block ids ("Draggable item sponsor-heading was dropped over droppable area sponsor-logo"), and it fires a "moved" announcement at pick-up because the item starts over itself. `@dnd-kit/modifiers` isn't installed, and the ticket doesn't touch `package.json`.

## Decision
- **Announcements:** custom, by block name, summary and position: "Picked up Heading, FREE WIFI, position 2 of 4.", "… moved to position 3 of 4.", "Dropped … at position 4 of 4.", "Cancelled. … stays at position 2 of 4." The "moved" line is skipped while the target is unchanged, so pick-up isn't overwritten. dnd-kit's default keyboard instructions are kept, and the handle is described by the row summary and then those instructions.
- **Pointer sensor:** a 4px distance constraint, so a tap on the handle doesn't start a drag.
- **Vertical only:** a one-line inline `Modifier` that zeroes `x`, instead of adding `@dnd-kit/modifiers`.
- **Lone block:** the handle and its sortable are disabled when there's only one block, matching its disabled move buttons.
- `DndContext` gets a `useId()` id so its accessibility ids match between server and client render.

## Alternatives
- **dnd-kit's default announcements:** read internal ids to the customer.
- **No activation constraint:** any click on the handle would start a drag.
- **Add `@dnd-kit/modifiers`:** outside this ticket's `touches`.

## Consequences
After a pointer drop, dnd-kit swallows document clicks for 50ms. `BlockList.test.tsx` waits that out in an `afterEach` so later tests' clicks land.
