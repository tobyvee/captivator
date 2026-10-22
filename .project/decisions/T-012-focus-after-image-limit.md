---
title: "Adding the second image moves focus to the new block's row, and move buttons only restore focus when the move disables them"
type: decision
project: captivator
ticket: T-012
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Adding the second image moves focus to the new block's row, and move buttons only restore focus when the move disables them

## Context
T-012's review found two focus issues in `BlockList.tsx`:

- Adding the image that reaches `MAX_IMAGES` disables the focused "+ Image" file input, which drops focus to `<body>`.
- The focus-after-move test passed without the restore code.

Tracing the second issue showed that React DOM 19.3 records the focused element before a commit and calls `focus()` on it again afterwards if it is still in the document (the selection-restore step after the mutation phase in `react-dom-client`). So a move button whose row React moves in the DOM keeps focus with no help from us. The only case React can't handle is a button the move disables at the list's end, because `focus()` on a disabled button does nothing.

This corrects only the focus bullet of `T-012-row-controls-are-siblings.md`, which said a DOM move drops focus. Its row layout and move-button bullets still apply, so it is not superseded.

## Decision
- **Image limit:** `addImage` runs `addBlock` inside `flushSync`. If the design is now at `MAX_IMAGES`, it focuses the new block's row button, which is already selected, found by `data-block-id` within the block list's `<aside>`. It skips this when focus has gone somewhere outside the add buttons while the image was shrinking, so it never takes focus away from where the customer put it.
- **Move buttons:** `move()` only hands focus to the block's other move button when the clicked one is now disabled. The "row moves in the DOM" case is left to React, and a test pins it (that the button is the same node and keeps focus).

## Alternatives
- **Focus the "2 of 2 images used." note:** it isn't interactive, and it would need `tabIndex={-1}`.
- **Focus the Image inspector heading:** that lives in another column, and the customer is working in the block list.
- **Keep restoring focus after every move:** it duplicates React's own restore and claims to fix a case that isn't broken.

## Consequences
The row's select button carries `data-block-id`. T-034 (drag to reorder) should rely on the same React behaviour for moved rows and only handle buttons that are removed or disabled.
