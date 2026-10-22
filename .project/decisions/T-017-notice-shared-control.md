---
title: "The amber warning note is one shared Notice control used by the preview stage and the photo panel"
type: decision
project: captivator
ticket: [T-017, T-009]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, design]
---
# The amber warning note is one shared Notice control used by the preview stage and the photo panel

## Context
`T-009-notices-share-amber-style.md` kept all amber warnings in one `Notice` so a restyle changes one component. `Notice` was private to `PreviewStage.tsx`, so T-017 copied its markup for the photo budget note (`T-017-photo-controls-visibility-and-zero-darken.md`). The T-017 review flagged the copy. `PreviewStage.tsx` belongs to T-009, which is done; no open ticket claims it.

## Decision
`Notice` moves to `src/editor/controls/Notice.tsx` with a `className` prop (PreviewStage passes its 420px cap). PreviewStage and PhotoAdjustments both use it. It has no live role of its own: PreviewStage's notices sit in the stage's one status region (`T-009-notices-one-live-region.md`) and the photo note isn't announced.

## Alternatives
- **Keep the copy:** two amber styles to keep in step.
- **A `role` prop on Notice:** no caller needs one now.

## Consequences
Later warnings (T-027's readability line, T-028's fit note) use this control. The T-013 contrast line keeps its own two-tone box, because it also has a green pass state.
