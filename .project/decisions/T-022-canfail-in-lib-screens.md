---
title: "canFail moves to src/lib/screens.ts so the store and the screen switcher share one rule"
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, editor]
---
# canFail moves to src/lib/screens.ts so the store and the screen switcher share one rule

## Context
T-022 code review, nit. The ticket put `canFail(form)` in `src/splash/validate.ts`, and `ScreenSwitcher` used it to hide Error. The store's `screenAfter` (`T-025-undo-keeps-screen-valid.md`) restated the same rule as `!termsOn && fields.length === 0`, because `src/lib/` must not import from `src/splash/` or the editor.

## Decision
`canFail` moves to a new pure module, `src/lib/screens.ts`. `screenAfter` in the store and `ScreenSwitcher` both import it, and its tests move from `validate.test.ts` to `src/lib/screens.test.ts`. `validate.ts` keeps the guest-side copy and `validateGuest`.

## Alternatives
- **Re-export it from `src/lib/` out of `src/splash/validate.ts`:** that makes `src/lib/` import from `src/splash/`, the direction the layering forbids.
- **Move all of `validate.ts` to `src/lib/`:** moves the guest error copy away from the renderer that shows it, for one function's sake.

## Consequences
Any later rule about which screens a form can produce goes in `src/lib/screens.ts`.
