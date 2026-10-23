---
title: "T-039: Gradient direction shows icons only"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: []
touches:
  - src/editor/controls/Segmented.tsx
  - src/editor/panels/BackgroundPanel.tsx
  - src/editor/panels/BackgroundPanel.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-039: Gradient direction shows icons only

## Context
Reported by the user with a screenshot: "On the gradient direction, just use the icons, no need for text". The labels wrapped onto several lines in the Background panel.

## Scope
- An `iconOnly` option on `Segmented`. With it, the label becomes the button's accessible name and tooltip.
- The gradient direction uses it. **Out of scope:** the other segmented controls.

## Acceptance criteria
- [x] The direction buttons show only their arrows, and each is named and titled "Top to bottom", "Diagonal" or "Left to right". *Checked in headless Chrome at 1440 × 950.*
- [x] Other segmented controls keep their text.
- [x] `BackgroundPanel.test.tsx` covers the names, titles and empty text. The existing direction tests still find the buttons by name.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Outcome
The direction row is three arrow buttons at full width. 882 tests pass.

## Decisions
- [`T-039-direction-icons-only.md`](../decisions/T-039-direction-icons-only.md): Gradient direction shows icons only, with each label as the button's name and tooltip
