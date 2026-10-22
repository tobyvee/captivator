---
title: "Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket"
type: decision
project: captivator
ticket: [T-016, T-017, T-032, T-033]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor, planning]
---
# Photo upload is P0 in the Background panel; fit, zoom, focus and darken are a separate P1 ticket

## Context
The brief requires background image upload (P0). Photo fit, zoom and focus are planned extras (P1). The focus drag is cut order item 2, and Unsplash is item 1. A single Background panel ticket would mix all three priorities in one file.

## Decision
- **T-016:** tabs, colour, gradient and photo upload. It also creates `PhotoAdjustments` and `UnsplashSearch` as stubs.
- **T-017:** replaces `PhotoAdjustments` and creates `FocusGrid`.
- **T-033:** adds the drag dot to `FocusGrid`.
- **T-032:** replaces `UnsplashSearch`.

## Alternatives
- **One 35-minute panel ticket:** mixes P0 with P1 and stretch work, and blocks clean cuts.

## Consequences
Cutting T-017, T-032 or T-033 leaves a working photo upload.
