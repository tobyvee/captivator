---
title: "Undo history uses a leading-edge debounce, not a throttle"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, store]
---
# Undo history uses a leading-edge debounce, not a throttle

## Context
Review finding 4: a 400ms throttle records a step every 400ms, so a 2-second colour drag makes about 5 undo steps.

## Decision
zundo's `handleSet` is wrapped in a leading-edge debounce (about 400ms, leading only). The undo test spreads 20 updates over 2 seconds with fake timers.

## Alternatives
- Explicit gesture boundaries (pause on pointerdown, resume on pointerup): exact, but needs wiring in every control. It can still be added to the colour picker later if testing shows the need.

## Consequences
Typing with pauses over 400ms makes several undo steps, which is acceptable.
