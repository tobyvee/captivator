---
title: "SplashPage takes a render mode of edit, preview or export"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, splash]
---
# SplashPage takes a render mode of edit, preview or export

## Context
Review finding 5: the editor and the export need different markup (terms link element, `required`, form action, Connect behaviour), and the `editable`/`compact`/`inFrame` props don't cover it.

## Decision
`mode: 'edit' | 'preview' | 'export'` replaces `editable`. The spec's **Render mode** table lists exactly what each mode changes. `compact` and `inFrame` stay as layout-only props. Thumbnails and the fit check use `preview`.

## Alternatives
- Keep the booleans and add `forExport`: allows meaningless combinations.
- Post-process the exported markup: fragile, and it forks rendering.

## Consequences
Every consumer passes `mode` explicitly. The `SplashPage` tests cover the differences between modes.
