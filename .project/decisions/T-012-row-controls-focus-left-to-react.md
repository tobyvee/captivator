---
title: "Block-list rows keep their sibling controls; after a move, focus is restored only when the clicked button is now disabled"
type: decision
project: captivator
ticket: T-012
decided_by: main session
supersedes: T-012-row-controls-are-siblings.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Block-list rows keep their sibling controls; after a move, focus is restored only when the clicked button is now disabled

## Context
`T-012-row-controls-are-siblings.md` said that React moving a row in the DOM drops focus to `<body>`, so `move()` put focus back after every move. While fixing the T-012 review, the nextjs-specialist traced React DOM 19.3: before each commit React records the focused element, and afterwards focuses it again if it's still in the document. So a moved row keeps its focus without help. The one case React can't recover is a move that disables the clicked button at the end of the list, because a disabled button can't take focus. `T-012-focus-after-image-limit.md` records the narrowed code; this file replaces the row decision so the log has one live version.

## Decision
- **Unchanged from the superseded file:** one row shape for every row, a `<div>` with the row look holding a full-width select `<button>` (`aria-current="true"` when selected) and any controls after it as siblings. Move Up and Move Down are 44×44 buttons side by side at the row's right end, and the summary truncates to fit.
- **Changed:** after a move, `move()` only acts when the clicked button is now disabled. It then focuses the same block's other move button. A moved row keeps focus through React's own restore, and a test pins that the button is the same node and keeps focus.
- **Added by the review:** each move button keeps its `aria-label` ("Move Image up") and is described by the row's summary, so same-named blocks can be told apart.

## Alternatives
- **Keep restoring focus after every move:** redundant with React's restore.
- **Remount rows on reorder:** would lose focus; the test guards against it.

## Consequences
The row's border sits on the wrapper, so the selected style covers the whole row, controls included. T-034's drag handle goes inside the wrapper, beside the select button. If React stops restoring focus across a commit, the "Move Heading down" test fails.
