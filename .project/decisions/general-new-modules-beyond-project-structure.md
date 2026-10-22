---
title: "Planning adds small modules to the spec's project structure so each ticket owns its own files"
type: decision
project: captivator
ticket: [T-001, T-004, T-008, T-009, T-011, T-016, T-017, T-019, T-022, T-026, T-027]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, planning]
---
# Planning adds small modules to the spec's project structure so each ticket owns its own files

## Context
Several features in the spec's *Project structure* share a file with others, or mix cuttable code with P0 code: palette extraction lives in `images.ts`, the checks live inside `PreviewStage`, the switcher lives inside the stage, and undo and export sit inside `TopBar`. Parallel tickets would collide on those files, and a cut ticket would leave a half-edited file behind.

## Decision
New files, each owned by one ticket (or a stub creator plus one replacer):
- **Libraries:**
  - `src/lib/types.ts` (T-001).
  - `src/lib/persist-storage.ts` (T-004).
  - `src/lib/palette.ts`: split out of `images.ts`; a stub from T-011, filled by T-026, cut 4.
  - `src/lib/readability.ts`: the design-wide check (T-027).
  - `src/lib/export.ts`: missing from the structure (review finding 23).
  - `src/splash/validate.ts` (T-022).
- **Editor controls and slots:**
  - `src/editor/controls/Switch.tsx` (T-008).
  - `src/editor/UndoRedo.tsx` and `src/editor/ExportButton.tsx` (T-008 stubs).
  - `src/editor/ScreenSwitcher.tsx` (T-009).
  - `src/editor/checks/ReadabilityCheck.tsx` and `src/editor/checks/useFitCheck.tsx` (T-009 stubs).
  - `src/editor/TemplateCard.tsx` (T-019).
- **Photo panel parts:**
  - `src/editor/panels/PhotoAdjustments.tsx` and `src/editor/panels/UnsplashSearch.tsx` (T-016 stubs).
  - `src/editor/panels/FocusGrid.tsx` (T-017).

## Alternatives
- **Keep the spec's file list exactly:** parallel tickets would edit the same files, and cuts would need code removal.

## Consequences
- `palette.ts` exists as a stub that returns `[]` until T-026. `ImageUpload` calls it through an `onPalette` callback, so cutting the palette needs no other change.
- The README's structure section should list these files.
