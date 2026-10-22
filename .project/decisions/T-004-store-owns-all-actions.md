---
title: "store.ts is created once with every action, and only the undo ticket edits it later"
type: decision
project: captivator
ticket: [T-004, T-025]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, planning]
---
# store.ts is created once with every action, and only the undo ticket edits it later

## Context
`store.ts` is a hotspot: most editor tickets dispatch to it, and two tickets editing it can't share a wave. The spec's action list omits things later tickets need: `setName`, `setLogoPalette`, the restore and save flags, `restored` for "Continue your design", and the hydration hook. Undo is a step 8 feature but lives in the same file.

## Decision
- **T-004:**
  - Defines the full `EditorState` with every action and flag, plus `useHydrated()`.
  - Puts the debounced storage wrapper in its own module, `persist-storage.ts`, in the same ticket.
  - `addBlock` takes a complete block, so the store doesn't need `contrast.ts`.
- **T-025** is the only later ticket that edits `store.ts`. It adds zundo `temporal` without changing the public API.

## Alternatives
- **Add `temporal` in T-004:** lengthens the critical path that every ticket waits on.
- **Let panel tickets add their own actions:** parallel edits to one file.

## Consequences
A ticket that needs a new action must report it rather than edit `store.ts`. T-025 must keep every export and signature unchanged.
