---
title: "T-025 also makes the store treat a design edited in this session as saved, so the picker offers Continue and asks before switching"
type: decision
project: captivator
ticket: [T-019, T-025]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, templates]
---
# T-025 also makes the store treat a design edited in this session as saved, so the picker offers Continue and asks before switching

## Context
`T-019-saved-design-means-restored.md` reads "a saved design exists" as the store's `restored` flag, which is only set when a stored design loads with the page. On the commonest first visit (pick a template, edit it, click Templates) the design is already in localStorage, yet the picker shows no "Continue your design" card and switches without asking, losing colours and layout. The milestone 5 review accepted closing the milestone but found the fix wasn't tracked anywhere. The fix is in `src/lib/store.ts`, which T-025 owns in wave 7.

## Decision
Add to T-025's scope: once the customer changes the design or name in this session, the store treats it as saved for the picker (set `restored`, or a new flag the picker reads, on the first accepted design or name change; template loads alone don't count). The main session makes the change on T-025's landing, with a store test and a picker test, and ticks T-019's Continue criterion then.

## Alternatives
- **A new ticket in wave 8:** wave 8's tickets don't touch `store.ts`, so it would wait a wave for a few lines.
- **Leave the gap:** the spec says "If a saved design exists, show 'Continue your design' first", and the gap loses work on the commonest path.

## Consequences
T-025's `touches` gains nothing new (it owns `store.ts`), but `src/editor/TemplateCard.test.tsx` gains a test in the same commit. T-019 is recorded done with its Continue criterion left open until T-025 lands.
