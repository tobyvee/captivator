---
title: "The phone frame's fold line uses the fit check's FOLD_HEIGHT"
type: decision
project: captivator
ticket: T-028
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, fit, editor]
---
# The phone frame's fold line uses the fit check's FOLD_HEIGHT

## Context
T-028's review found the fold height defined twice: `FOLD_PX = 600` in `src/editor/frames/PhoneFrame.tsx` (T-009) and `FOLD_HEIGHT` in `src/lib/fit.ts`. The dashed line and the check that shows it could drift apart. `PhoneFrame.tsx` isn't in T-028's `touches`, but no open ticket claims it.

## Decision
`PhoneFrame` imports `FOLD_HEIGHT` from `@/lib/fit` and drops its own constant; `PhoneFrame.tsx` joins T-028's `touches`.

## Alternatives
- **A follow-up ticket:** a one-line change doesn't need its own ticket, and the file is free.
- **Leave both constants:** two sources for one spec number.

## Consequences
`lib/fit.ts` owns the fold height for both the check and the line.
