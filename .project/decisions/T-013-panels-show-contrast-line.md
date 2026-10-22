---
title: "The Text and Terms panels show a per-item contrast line"
type: decision
project: captivator
ticket: [T-013, T-020]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor, checks]
---
# The Text and Terms panels show a per-item contrast line

## Context
The canvas's `Main` and `EditorTerms` artboards show "Easy to read 8.0:1…" inside the Text and Terms panels. The PRD's Text inspector also lists "a contrast result checked against both ends of a gradient". The spec's panel list omits it and only puts a design-wide result under the preview. `contrast.ts` exists from step 1.

## Decision
TextPanel and TermsPanel compute their item's worst-case ratio with `contrast.ts` and show it. On photo backgrounds they show "Check readability over your photo" instead (`general-photo-contrast-approximate.md`).

## Alternatives
- **Only the design-wide line under the preview:** doesn't match the canvas, and gives no feedback where the colour is chosen.

## Consequences
About 3 minutes per panel, and both panels depend on T-003. The line isn't cut with anything; it's part of P0/P1 panels.
