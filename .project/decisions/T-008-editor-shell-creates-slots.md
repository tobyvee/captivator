---
title: "The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub"
type: decision
project: captivator
ticket: [T-008, T-009, T-012, T-013, T-014, T-015, T-016, T-020, T-024, T-025]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor, planning]
---
# The editor shell owns Inspector.tsx and TopBar.tsx and creates every later editor component as a stub

## Context
Panels, the block list, the preview stage, undo and export are separate tickets that run in parallel. Each must be wired into the Inspector, the top bar or the page without two tickets editing the same router file.

## Decision
- **T-008 writes in full:**
  - `Inspector.tsx`: routing, plus a shared header with Delete for blocks and the Terms on/off switch.
  - `TopBar.tsx`.
  - The editor page.
- **T-008 stubs**, with final names and props: `BlockList`, `PreviewStage`, `UndoRedo`, `ExportButton` and all six panels.
- **T-009 stubs**, the same way: `ScreenSwitcher`, `ReadabilityCheck` and `useFitCheck`.
- Each later ticket replaces only its own file.

## Alternatives
- **A wiring ticket after the parts:** a serial step at the end of step 3.
- **Panels register themselves in `Inspector.tsx`:** parallel edits to one file.

## Consequences
The Inspector header owns Delete, so the Text and Image panels don't need it. A panel that needs a new prop reports it.
