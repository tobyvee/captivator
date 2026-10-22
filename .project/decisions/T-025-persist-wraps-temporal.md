---
title: "persist wraps temporal, so undo saves the restored design and hydration isn't recorded"
type: decision
project: captivator
ticket: T-025
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, undo, persistence]
---
# persist wraps temporal, so undo saves the restored design and hydration isn't recorded

## Context
The ticket leaves the middleware order open: `temporal(persist(…))` or `persist(temporal(…))`, as long as `useStore.persist` and `useStore.temporal` both exist and persist's `partialize`/`merge` are unchanged. zundo's `undo`/`redo` call the `set` that `temporal` was given, and persist's `hydrate` calls the `set` that `persist` was given.

## Decision
`create<EditorState>()(persist(temporal(creator, undoOptions), persistOptions))`. Undo and redo set the design through persist's wrapped `set`, so the restored design is written (its reference differs from the last saved one, `T-004-write-only-on-design-change.md`). Hydration's `set` is the raw store `set`, so it never reaches the history, and `onRehydrateStorage` also calls `temporal.clear()` so history is empty after hydration either way.

## Alternatives
- `temporal(persist(…))`: undo would call the raw `set`, bypassing persist, so an undone design wouldn't be saved until the next edit; hydration would also pass through the history.

## Consequences
`useStore.setState` (persist-wrapped, then temporal-wrapped) records design changes as an action does, so tests that reset the store with `setState(getInitialState(), true)` should also call `useStore.temporal.getState().clear()`.
