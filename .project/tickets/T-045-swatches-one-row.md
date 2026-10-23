---
title: "T-045: Colour suggestions in one tight row"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: []
touches:
  - src/editor/controls/ColourField.tsx
  - src/editor/controls/ColourField.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-045: Colour suggestions in one tight row

## Context
The user, with a screenshot of the "In this design" suggestions: "The color chips are too far about. They shouldn't wrap."

## Scope
- In `ColourField`'s suggestion rows, put the title above and the dots in one unwrapped row, with 30×44px targets.

## Acceptance criteria
- [x] At 1052px (the narrowest side-by-side inspector), the Connect button panel's rows sit on one line, with dots 6px apart and aligned with the title. *Checked in headless Chrome. Five suggestions end 101px short of the edge, so eight fit.*
- [x] A test checks that the row doesn't wrap, and checks the target size.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Outcome
The suggestions are a compact single row. 888 tests pass.

## Decisions
- [`T-045-swatches-one-row.md`](../decisions/T-045-swatches-one-row.md): Colour suggestions sit in one unwrapped row under their title, as 30×44px targets around 24px dots
