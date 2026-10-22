---
title: "The Segmented track is zinc-200, the canvas's #E4E4E7, so it shows against the page"
type: decision
project: captivator
ticket: [T-009, T-010]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, design]
---
# The Segmented track is zinc-200, the canvas's #E4E4E7, so it shows against the page

## Context
The milestone 2 review found that `Segmented`'s track used `bg-zinc-100`, the same colour as the editor page, so the screen switcher and device toggle had no visible track. The canvas draws the group in `#E4E4E7`. `Segmented.tsx` belongs to T-010, which is done, and no open ticket claims it.

## Decision
Change the track to `bg-zinc-200` in the T-009 record commit.

## Alternatives
- **Leave it:** the pressed button's white fill is then the only cue.
- **A border on the track:** the canvas doesn't draw one.

## Consequences
Every `Segmented` (device toggle, screen switcher, panel tabs) gets the darker track.
