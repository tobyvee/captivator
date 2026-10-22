---
title: "Zoom is hidden for Show whole photo, the backdrop colour only shows for it, and darkening to 0% keeps the overlay"
type: decision
project: captivator
ticket: T-017
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, background]
---
# Zoom is hidden for Show whole photo, the backdrop colour only shows for it, and darkening to 0% keeps the overlay

## Context
T-017 allows the Zoom slider to be "hidden or disabled" for Show whole photo, says the backdrop colour is "fit only", and says to create an overlay when it is null, without saying what 0% does. The canvas draws the size note in the amber warning style but doesn't say whether it is announced.

## Decision
- **Zoom** is unmounted for Show whole photo, and **Colour around the photo** takes its place under the Photo size help text. The stored `zoom` is kept, so switching back restores it.
- **Darken** writes `opacity` into the existing overlay, keeping its `from` and `to`; a null overlay becomes `#000000 → #000000`. Dragging to 0% stores opacity 0 rather than `null`.
- **Size note** copies PreviewStage's amber Notice look (`Notice` isn't exported and PreviewStage is another ticket's file), has no live role, and rounds to at least 1 KB.

## Alternatives
- **Disable Zoom:** a disabled slider showing a value that has no effect is more confusing than none, and it would sit beside the backdrop field.
- **Null the overlay at 0%:** the template's own overlay stops would be lost the moment the slider crossed 0.
- **`role="status"` on the size note:** it would be read out on every upload and asks for no action.

## Consequences
A photo always has an overlay object once darken is used. Contrast for a 0% overlay blends nothing, which matches no overlay.
