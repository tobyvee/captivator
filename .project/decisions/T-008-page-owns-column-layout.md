---
title: "The editor page owns the three columns' sizes and surfaces; each column component only fills its slot"
type: decision
project: captivator
ticket: [T-008, T-009, T-012]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, layout]
---
# The editor page owns the three columns' sizes and surfaces; each column component only fills its slot

## Context
T-008 gives the column sizes (block list `flex: 1 1 272px; max-width: 300px`, stage `flex: 1 1 480px; min-width: 0`, inspector `flex: 1 1 300px; max-width: 340px`) but not where they live. `BlockList` and `PreviewStage` are stubs that T-012 and T-009 replace, and the skeleton has to match the real layout. On the `Main` artboard the column sizes sit on the `<aside>`/`<main>` elements themselves.

## Decision
- `src/app/editor/page.tsx` wraps each column in a wrapper element that carries its flex sizing, white surface and border. A shared `Layout` renders both the skeleton and the editor.
- `BlockList`, `PreviewStage` and `Inspector` render their own landmark (`<aside aria-label="Blocks">`, `<section aria-label="Preview">`, `<aside aria-label="{title} settings">`) with `flex-1` and their own padding, and nothing else about the layout.
- Below `md`, the side columns drop their `max-width` so the stacked single column fills the screen.

## Alternatives
- **Each component owns its flex sizing, as on the canvas:** T-009 and T-012 would have to copy the sizes exactly, and the skeleton would duplicate them in a third place.
- **Pass a `className` prop to each column:** changes the stub props the ticket fixes.

## Consequences
T-009 and T-012 keep a root that fills its slot (`flex-1`) and don't set widths or column borders. The page uses `<main>` for the whole row, so `PreviewStage` uses a `<section>` landmark rather than the canvas's `<main>`.
