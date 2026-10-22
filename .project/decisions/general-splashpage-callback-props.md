---
title: "SplashPage takes selection, onSelect and onScreenChange props"
type: decision
project: captivator
ticket: [T-005, T-007, T-009, T-021, T-022]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash]
---
# SplashPage takes selection, onSelect and onScreenChange props

## Context
In edit mode, clicking a block must call `setSelection`. The terms link and Connect must change the screen. But the renderer may not import the store or editor code. The decided signature is `({ design, screen, mode, compact?, inFrame? })` (`general-splashpage-render-mode.md`), which has no way to report clicks.

## Decision
Add three optional props:
- `selection`: draws the edit-mode outline and name chip.
- `onSelect(selection)`.
- `onScreenChange(screen)`.

Only edit and preview modes use them; export ignores them. `mode` is still the only prop that changes the markup structure.

## Alternatives
- **A React context provided by the editor:** hidden coupling between the splash and the editor.
- **Import the store:** breaks the portability rule.

## Consequences
`PreviewStage` passes the store's `setSelection` and `setScreen`. Thumbnails, the fit probe and the export pass none of these props.
