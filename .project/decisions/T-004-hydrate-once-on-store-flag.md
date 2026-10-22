---
title: "useHydrated rehydrates only while the store's own hasHydrated flag is false"
type: decision
project: captivator
ticket: T-004
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, hydration, client]
---
# useHydrated rehydrates only while the store's own hasHydrated flag is false

## Context
The ticket says `useHydrated()` calls `useStore.persist.rehydrate()` once in a `useEffect`. Effects run twice in React Strict Mode in development, and both the editor (T-008) and the picker (T-019) use the hook, so a client-side navigation would rehydrate again. A second rehydrate re-runs `merge`, which re-raises `restoreFailed` after the customer dismissed it. Zustand 5.0.16's `persist.hasHydrated()` stays `false` after a failed (corrupt JSON) hydration, so it can't be the guard.

## Decision
The effect calls `rehydrate()` only when `useStore.getState().hasHydrated` is false. `onRehydrateStorage` sets that flag on success and on failure. With synchronous `localStorage`, zustand's persist resolves in the same tick, so Strict Mode's second effect is skipped.

## Alternatives
- **Guard on `persist.hasHydrated()`:** retries after corrupt JSON on every mount.
- **A `useRef` per component:** still rehydrates once per component that uses the hook.
- **No guard:** repeated merges and a dismissed notice that comes back.

## Consequences
Hydration happens once per page load. The server render and the first client render both see `hasHydrated: false`, so the skeleton matches and there's no hydration mismatch.
