---
title: "The picker treats a saved design as the store's restored flag, as the ticket says, and leaves the in-session gap to a store change"
type: decision
project: captivator
ticket: T-019
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, picker, store, persistence]
---
# The picker treats a saved design as the store's restored flag, as the ticket says, and leaves the in-session gap to a store change

## Context
T-019 shows "Continue your design" and asks before switching "if `restored`". `restored` is set only when `rehydrate()` merges a stored design at page load (`src/lib/store.ts`). A customer who starts from a template, edits it and comes back to `/` through the editor's Templates link in the same page load has a saved design, but `restored` is still `false`: the picker shows no Continue card and switches without asking. A reload fixes it. `store.ts` belongs to T-025 this wave (`T-004-store-owns-all-actions.md`).

## Decision
The picker reads `restored` only. It doesn't read `localStorage` itself or infer edits from the design.

## Alternatives
- **Read `STORAGE_KEY` from `localStorage` in the page:** a second reader of the persisted format beside `persist`, and it misses a write still in the 300ms debounce.
- **Compare the design to the templates:** `loadTemplate` returns a freshly parsed object, so reference equality can't tell a loaded template from an edited one, and a deep compare stringifies data URLs.

## Consequences
The same-session case is open. The fix belongs in `store.ts`: for example, set `restored` (or a new `hasSaved` flag) whenever the storage wrapper accepts a write of a changed design or name. The picker then needs no change. Reported to the main session as a follow-up.
