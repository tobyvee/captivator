---
title: "FocusGrid is a client component with a draggable dot at the exact focus point, replacing the per-square marker"
type: decision
project: captivator
ticket: [T-033, T-017]
decided_by: main session
supersedes: T-017-focus-grid-photo-and-marker.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, photo]
---
# FocusGrid is a client component with a draggable dot at the exact focus point, replacing the per-square marker

## Context
`T-017-focus-grid-photo-and-marker.md` kept FocusGrid prop-only with no `"use client"` and marked the pressed square with the canvas's blue dot, leaving T-033 to add the drag dot and drop the marker. T-033 did both: the arrow-key announcement needs React state, so FocusGrid gained `"use client"` (`T-033-arrow-key-announcement.md`), and the dot now sits at the exact focus point (`T-033-drag-dot-inset-track.md`). Without a superseding file the log would show two live, conflicting decisions.

## Decision
FocusGrid is `"use client"` and draws one dot at the exact focus point, draggable and arrow-key movable; the per-square marker is gone. The rest of T-017's decision stays in force:
- **Props:** `value`, `onChange`, optional `src` (the photo behind the grid, `object-fit: cover`) and `describedBy`.
- **Group:** `role="group"`, `aria-label="Focus point"`, with the visible label `aria-hidden` in PhotoAdjustments.
- **Labels:** "Focus top left" … "Focus bottom right".
- **Pressed:** each axis rounds to the nearest of 0, 50 and 100, and exactly that square has `aria-pressed`.

## Alternatives
- **Keep the per-square marker as well:** two dots for one value.
- **Keep FocusGrid server-safe:** the announcement needs state, and T-008's rule puts `"use client"` on stateful modules.

## Consequences
The thumbnail still crops wide or tall photos, so a square only approximates the photo region it picks; the dot shows the exact point.
