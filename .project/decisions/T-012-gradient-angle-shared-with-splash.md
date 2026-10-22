---
title: "The block list's background swatch takes the gradient ANGLE map from the splash renderer, not a copy"
type: decision
project: captivator
ticket: [T-012, T-006]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, splash]
---
# The block list's background swatch takes the gradient ANGLE map from the splash renderer, not a copy

## Context
T-012's review found that `src/editor/BlockList.tsx` copied the `ANGLE` map (gradient direction to CSS angle) from `src/splash/Background.tsx`, which belongs to T-006 (done). If a direction is added or an angle changes, the swatch would stop matching the preview. `T-016-credit-href-shared-with-splash.md` already set the precedent of the editor importing small helpers from the splash renderer.

## Decision
`src/splash/Background.tsx` exports `ANGLE` (adding only `export` and a one-line comment), and `BlockList.tsx` imports it from `@/splash/Background`. The splash renderer still has no editor imports.

## Alternatives
- **Keep the copy:** the two could drift silently.
- **Move `ANGLE` to `src/lib/`:** it is render detail that belongs with the renderer, and moving it changes T-006's code for one constant.

## Consequences
The import goes editor to splash, the allowed direction. A change to gradient angles is a splash change, so it gets the splash audit, and the swatch follows it automatically.
