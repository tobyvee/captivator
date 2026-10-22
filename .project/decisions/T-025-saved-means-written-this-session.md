---
title: "The store's hasSaved flag replaces restored: set when a design is restored at load or an edit is written after hydration"
type: decision
project: captivator
ticket: [T-025, T-019]
decided_by: main session
supersedes: T-025-store-marks-in-session-saves.md
updated: 2026-10-23
tags: [project, captivator, decision, store, templates]
---
# The store's hasSaved flag replaces restored: set when a design is restored at load or an edit is written after hydration

## Context
`T-025-store-marks-in-session-saves.md` moved the in-session "saved design" fix into T-025 and suggested that template loads alone shouldn't count. Building it showed that a loaded template is already written to storage (`T-004-write-only-on-design-change` writes any design change), so after a reload it counts as saved. Not counting it in-session would make the picker behave differently before and after a reload.

## Decision
- `restored` is renamed `hasSaved` ("a design is saved"). `mergeStored` sets it when a stored design restores, as before.
- The storage wrapper also sets it the first time it accepts a write of a changed design or name after hydration. That is exactly when localStorage starts holding this session's work, so the picker's Continue card and confirm match what a reload would show. Template loads count, as they do after a reload.
- The hydration gate keeps a test's `setState(getInitialState(), true)` reset from counting as an edit; in the app, nothing writes before hydration.
- The picker (`src/app/page.tsx`) reads `hasSaved`; no other logic changes.

## Alternatives
- **Keep `restored` and set it on writes:** the name would no longer mean what it says.
- **Exclude template loads:** inconsistent with the reload case, and more code.
- **Set the flag in each design action:** eight call sites instead of the one place that knows a write was accepted.

## Consequences
A customer who picks a template and comes straight back sees "Continue your design" and is asked before switching, as after a reload. If a write fails (quota), the flag is still set: the design is still in this tab's memory, which is what Continue opens. T-019's Continue criterion is met.
