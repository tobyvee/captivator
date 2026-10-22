---
title: "A store subscriber applies updateForm's screen rules to every design change, so undo and redo keep the screen valid"
type: decision
project: captivator
ticket: T-025
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, undo]
---
# A store subscriber applies updateForm's screen rules to every design change, so undo and redo keep the screen valid

## Context
T-025 code review, must-fix. zundo's `undo`/`redo` set `{ design }` straight through persist's `set`, so the screen rules in `updateForm` (`T-004-terms-selection-switches-screen.md`, `T-025-terms-switch-shows-terms-screen.md`, `T-025-terms-on-means-mode-change.md`) never ran. Undoing "terms on" left the preview on the Terms screen with terms off, and the screen switcher showed no pressed segment.

## Decision
- The rules move into one helper, `screenAfter(prevForm, form, selection, screen)`, in `src/lib/store.ts`. `updateForm` calls it as before, in the same `set` as the design.
- A `useStore.subscribe` registered after the store is created runs the same helper whenever `design` changes by reference, and calls `setState({ screen })` only if the result differs.
  - After an action that already chose its screen, the helper returns the same screen, so the subscriber does nothing.
  - After undo or redo, it returns to Landing from the Terms or Error screen when the restored design can't produce them. When redo turns terms back on while Terms is selected, it shows the Terms screen, as the original edit did.
- The nested `setState` records no undo step: zundo checks `equality` (design by reference) before calling `handleSet`, so the debounce gate isn't touched either. It doesn't add a storage write. The storage wrapper (`T-004-write-only-on-design-change.md`) writes the restored design once, from whichever of the nested or outer `setItem` calls runs first, and skips the other.

## Alternatives
- **`wrapTemporal` to wrap `undo`/`redo`:** works only for those two paths and means typing against zundo's mutator generics, which `T-025-undo-gate-reopens-after-undo.md` already avoided.
- **Fix the screen in `ScreenSwitcher`:** panel logic deciding screens, which the store owns.
- **Let only the subscriber set the screen, removing it from `updateForm`:** each form edit would cost two `set` calls and two renders.

## Consequences
The screen invariant holds for every design change, including future actions and `setState` in tests, with no per-action code. Any later screen rule goes in `screenAfter`, so `updateForm` and the subscriber can't drift apart.
