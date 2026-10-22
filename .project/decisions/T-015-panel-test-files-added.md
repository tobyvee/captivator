---
title: "T-015 adds FieldsPanel.test.tsx and ButtonPanel.test.tsx for the panels' jsdom tests"
type: decision
project: captivator
ticket: T-015
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-015 adds FieldsPanel.test.tsx and ButtonPanel.test.tsx for the panels' jsdom tests

## Context
T-015's `touches` lists only `FieldsPanel.tsx` and `ButtonPanel.tsx`, and the spec's test table has no panel row. Its acceptance criteria are behaviour a test can pin: the third checkbox disables, fields follow tick order in the preview, colours show live, and an emptied label shows "Required" without touching the store. No other ticket claims these files. Precedents: `T-014-image-panel-test-file-added.md`, `T-016-panel-test-file-added.md`; `general-inspector-test-leaves-panels-to-their-tests.md` makes each panel's own test file the place its body is covered.

## Decision
Add co-located jsdom tests: `src/editor/panels/FieldsPanel.test.tsx` (9 cases) and `src/editor/panels/ButtonPanel.test.tsx` (9 cases). They drive the panels with `userEvent.setup()` and check the preview by rendering `SplashPage` from the store's design.

## Alternatives
- **No committed tests:** a regression in the field cap or the label guard wouldn't fail the build.
- **Cases in `src/editor/editor.test.tsx`:** owned by T-008, and parallel panel tickets would collide on it.

## Consequences
Both files join T-015's `touches`. They rely on the same `beforeEach` store and `localStorage` reset as the other panel tests.
