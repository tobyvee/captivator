---
title: "T-004 adds store.hydration.test.tsx to its touches for the jsdom hydration tests"
type: decision
project: captivator
ticket: T-004
decided_by: main session
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, testing]
---
# T-004 adds store.hydration.test.tsx to its touches for the jsdom hydration tests

## Context
The T-004 code review asked for tests of `useHydrated` and its run-once guard (`T-004-hydrate-once-on-store-flag.md`). Those tests need jsdom and React (`renderHook` inside `StrictMode`), while `store.test.ts` runs in the node environment. No `todo` or `doing` ticket claims a store hydration test file.

## Decision
`src/lib/store.hydration.test.tsx` holds the two jsdom tests and is added to T-004's `touches`.

## Alternatives
- Switch all of `store.test.ts` to jsdom: this slows the file and hides node-only assumptions in the store.
- Leave the hook untested: the guard exists to stop a dismissed "Couldn't restore" notice from coming back, and nothing would pin that behaviour.

## Consequences
T-025 owns undo tests in `store.undo.test.ts`. A later ticket that changes hydration (T-025 clears history after rehydration) should extend `store.hydration.test.tsx`.
