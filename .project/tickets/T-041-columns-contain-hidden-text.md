---
title: "T-041: Hidden status text can't make the editor page scroll past the window"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: []
touches:
  - src/app/editor/page.tsx
  - src/editor/editor.test.tsx
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, editor]
---
# T-041: Hidden status text can't make the editor page scroll past the window

## Context
Reported by the user with a screenshot after T-036 deployed: "On desktop, after the unsplash previews have loaded the whole page scrolls past the viewport." Visually hidden status lines are absolutely positioned, and no column was positioned, so one below a column's fold stretched the page ([`T-041-columns-contain-hidden-text.md`](../decisions/T-041-columns-contain-hidden-text.md)).

## Scope
- From 1052px, the three column wrappers in `src/app/editor/page.tsx` are `relative`.
- The class-contract test in `editor.test.tsx` covers it.

## Acceptance criteria
- [x] At 1440 × 900 with a column taller than the window and hidden text below its fold, the document is exactly window-tall (933px before, 900px after). *Measured in headless Chrome against the dev server.*
- [x] The fit probe adds no horizontal scroll to the stage.
- [x] Below 1052px the columns aren't positioned.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.
- [ ] With Unsplash results loaded in the deployed editor, the page doesn't scroll. *Needs the user, with the T-036 re-check.*

## Outcome
Each column contains its own hidden text, so the editor stays window-tall. 883 tests pass.

## Decisions
- [`T-041-columns-contain-hidden-text.md`](../decisions/T-041-columns-contain-hidden-text.md): Each editor column is positioned when side by side, so hidden text below its fold stays inside it
