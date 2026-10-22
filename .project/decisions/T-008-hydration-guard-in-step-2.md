---
title: "The hydration guard ships with the editor shell in build step 2"
type: decision
project: captivator
ticket: [T-008, T-019]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, editor, persistence, planning]
---
# The hydration guard ships with the editor shell in build step 2

## Context
Step 5 lists the hydration guard. But persistence (P0) is built in step 1 with `skipHydration: true`, and the editor page is created in step 2. Without `rehydrate()`, saved designs never load.

## Decision
- **T-008:** the editor page calls `useHydrated()` and shows a skeleton until hydration finishes.
- **Step 5 (T-019):** keeps the picker's "Continue your design", which reuses the same hook.

## Alternatives
- **Add the guard in step 5:** `editor/page.tsx` gets a second owner, and persistence can't be checked until then.

## Consequences
Refreshing keeps the design from step 2 onwards.
