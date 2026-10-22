---
title: "PreviewStage ships a Landing/Terms switcher; Error and Connected are added by the cuttable guest-screens ticket"
type: decision
project: captivator
ticket: [T-009, T-022]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor, planning]
---
# PreviewStage ships a Landing/Terms switcher; Error and Connected are added by the cuttable guest-screens ticket

## Context
Cut order item 3 cuts "the screen switcher down to Landing and Terms", so those two screens are the floor that survives any cut. The build plan puts the switcher in step 6, but `PreviewStage` (step 2) has to render it.

## Decision
- **T-009** creates `ScreenSwitcher` with Landing and Terms. Terms shows only when terms are on.
- **T-022** (cut_rank 3) adds Error, shown only when something can fail, and Connected, along with those screens.

## Alternatives
- **The whole switcher in step 6:** needs a stub plus a later replacement anyway.
- **All four options in T-009:** cutting T-022 would then need an edit to T-009's file.

## Consequences
Cutting T-022 needs no other change.
