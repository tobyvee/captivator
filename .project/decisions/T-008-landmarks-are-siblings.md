---
title: "The editor's block list, stage and inspector are sibling landmarks; only the stage is <main>"
type: decision
project: captivator
ticket: T-008
decided_by: main session
supersedes: T-008-page-owns-column-layout.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, layout, accessibility]
---
# The editor's block list, stage and inspector are sibling landmarks; only the stage is <main>

## Context
`T-008-page-owns-column-layout.md` wrapped the whole three-column row in `<main>`, which nested the block list's and the inspector's `<aside>` landmarks inside the main landmark. Code review of T-008 flagged this: complementary landmarks should sit beside `<main>`, not inside it, so screen-reader landmark navigation reads blocks, preview and settings as three peers. Review also found that between `md` (768px) and the 1052px sum of the flex bases, the inspector wraps onto its own row while still capped at 340px and bordered on the left.

## Decision
- `src/app/editor/page.tsx` still owns every column's flex sizing, white surface and borders, and one `Layout` still renders both the skeleton and the editor. Each column component only fills its slot (`flex-1`) with its own landmark and padding.
- The row is a plain `<div>`. The block-list and inspector wrappers are `<div>`s around their components' `<aside>`s, and the stage wrapper is the page's only `<main>`: `<div row><div blocks/><main stage/><div inspector/></div>`.
- Below 1052px (272 + 480 + 300, where the inspector wraps) the inspector drops its `max-width` and swaps its left border for a top border. Below `md` the side columns still drop their `max-width`.

## Alternatives
- **Keep `<main>` around the row:** nests complementary landmarks inside main, which review rejected.
- **Let `PreviewStage` render `<main>` itself, as on the canvas:** splits the column's element from its sizing, which the page owns; the wrapper carrying both keeps the skeleton and the editor identical.

## Consequences
T-009's `PreviewStage` renders inside `<main>`, so it must not render another `<main>`; its `<section aria-label="Preview">` (or a plain element) is fine. T-009 and T-012 still don't set widths or column borders. The 1052px breakpoint must change if any column's flex basis does.
