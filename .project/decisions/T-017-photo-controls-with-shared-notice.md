---
title: "Zoom is hidden for Show whole photo, darkening to 0% keeps the overlay, and the size note uses the shared Notice"
type: decision
project: captivator
ticket: T-017
decided_by: main session
supersedes: T-017-photo-controls-visibility-and-zero-darken.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, background]
---
# Zoom is hidden for Show whole photo, darkening to 0% keeps the overlay, and the size note uses the shared Notice

## Context
`T-017-photo-controls-visibility-and-zero-darken.md` said the photo size note copies PreviewStage's private amber `Notice`. The T-017 review fix moved `Notice` into a shared control (`T-017-notice-shared-control.md`) and changed the note's KB measure (`T-017-budget-note-counts-base64.md`). This file replaces the earlier one so the log has one live version of its rules.

## Decision
- **Unchanged:** Zoom is unmounted for Show whole photo, and Colour around the photo takes its place; the stored `zoom` is kept. Darken writes `opacity` into the existing overlay, keeping its stops; a null overlay becomes `#000000 → #000000`, and 0% stores opacity 0, not `null`. The size note has no live role and shows at least 1 KB.
- **Changed:** the size note renders with the shared `src/editor/controls/Notice.tsx`, and counts the photo's base64 length.

## Alternatives
As in the superseded file: disabling Zoom, nulling the overlay at 0%, and a live size note were rejected for the reasons given there.

## Consequences
A photo always has an overlay object once darken is used. A restyle of the amber notes changes one component.
