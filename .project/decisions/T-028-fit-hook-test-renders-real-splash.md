---
title: "The fit hook's test wraps the real SplashPage instead of replacing it"
type: decision
project: captivator
ticket: T-028
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, fit, testing]
---
# The fit hook's test wraps the real SplashPage instead of replacing it

## Context
`useFitCheck` finds the element to observe with `:scope > div`, which relies on SplashPage's root being a `<div>` (`T-028-probe-clips-to-zero-height.md`). The review found `useFitCheck.test.tsx` replaced SplashPage with a bare `<div>`, so the test would stay green if the real root changed tag and the check silently stopped warning.

## Decision
The mock wraps the real `SplashPage`, recording its props and rendering it, and the tests observe the real root (checked by its text). Changing the hook's selector to another tag now fails three tests.

## Alternatives
- **Keep the bare mock:** tests the hook against an assumption rather than the renderer.
- **Drop the mock:** the props assertions (compact, preview, no `inFrame`) would need to read them from markup.

## Consequences
A change to SplashPage's root element fails the fit hook's tests.
