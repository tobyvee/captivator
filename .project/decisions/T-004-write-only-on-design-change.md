---
title: "Persistence writes only when the design or name changes, and stringifies only when the debounce fires"
type: decision
project: captivator
ticket: T-004
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, persistence, store]
---
# Persistence writes only when the design or name changes, and stringifies only when the debounce fires

## Context
Code review of T-004 found that loading the page wrote to storage. Zustand 5.0.16's `persist` wraps `setState`, so every set writes: hydration's own merged state, `onRehydrateStorage`'s `hasHydrated` flag, and UI-only actions like `setDevice`. The untouched Sponsor design was then saved, so the next visit reported `restored: true` (T-019's "Continue your design") for a design the customer never edited. A stored design that failed the schema was also overwritten with Sponsor about 300ms after load, before the customer saw "Couldn't restore your saved design". The review also found that `createJSONStorage` ran `JSON.stringify` on every set, above the debounce, which the spec's wrapper exists to avoid for image data URLs. And `migrate` returned a valid Sponsor, so an older stored version counted as a successful restore.

## Decision
- **Write only on change:** the store's `PersistStorage` remembers the `{ design, name }` it last handed to storage, or that hydration left in the store (recorded in `merge`). It skips any write whose `design` and `name` are reference-equal to those. Design identity changes only on a successful design action (`T-004-store-keeps-parsed-design.md`), so this is exact without a deep compare.
- **Stringify in the debounce:** `createDebouncedStorage` is a Zustand `PersistStorage` (not a `StateStorage` behind `createJSONStorage`). It keeps the latest `StorageValue` object and runs `JSON.stringify` only when the timer fires or on flush. `getItem` returns the pending object or parses storage.
- **Migrate fails the restore:** `migrate` returns `{}`, which fails `merge`'s parse, so Sponsor stays and `restoreFailed` is set. The persisted state type is `Partial<Persisted>` to allow this.

## Alternatives
- **Subscribe to `design`/`name` and write manually, without `persist`:** loses `persist`'s versioning, `rehydrate` and `skipHydration`, which the spec and T-008 build on.
- **Deep-compare the serialised state before writing:** stringifies data URLs on every set, the cost the debounce exists to avoid.
- **Guard in `onRehydrateStorage` only:** hydration's own `set` and UI actions would still write.

## Consequences
A visit that edits nothing leaves storage as it was, including corrupt, invalid or older-version data, until the customer's first real edit replaces it. After a failed write (quota), setting `saveFailed` no longer retries the same value; the next design or name change does. T-025 must keep `design` identity stable for no-op changes (zundo's undo restores an earlier object, which differs from the last saved one, so undo still writes).
