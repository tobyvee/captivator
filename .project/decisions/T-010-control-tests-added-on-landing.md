---
title: "T-010's controls get committed jsdom tests when the ticket lands"
type: decision
project: captivator
ticket: T-010
decided_by: main session
supersedes: T-010-no-committed-control-tests.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-010's controls get committed jsdom tests when the ticket lands

## Context
T-010's implementer checked `ColourField` and `Slider` with a temporary test, then deleted it, because the ticket's `touches` listed no test file (`T-010-no-committed-control-tests.md`). Without committed tests, a regression in the colour field (hex parsing, focus, swatch rows) wouldn't fail the build, and every inspector panel uses it.

## Decision
While landing T-010, the main session had the test-writer add `src/editor/controls/ColourField.test.tsx` (26 cases) and `src/editor/controls/Slider.test.tsx` (7 cases). No open ticket claims these files, so they join T-010's `touches`, the same way T-008 added `editor.test.tsx`.

## Alternatives
- A follow-up ticket for the tests: it adds a ticket and a wave slot for work that belongs with the controls.
- No tests: the spec's test table doesn't require them, but the controls carry real logic (validation, normalisation, focus).

## Consequences
Panel tickets get these tests as a regression net. react-colorful's sliders read `keyCode`, so picker tests send `keyCode` rather than `key`.
