---
title: "T-035's Fix tests go in ReadabilityCheck.test.tsx"
type: decision
project: captivator
ticket: T-035
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests, contrast]
---
# T-035's Fix tests go in ReadabilityCheck.test.tsx

## Context
T-035's `touches` lists only `ReadabilityCheck.tsx`. The acceptance criteria need jsdom tests: white on white becomes readable after Fix, and each Fix is one undo step. T-027 created the co-located test file for this component (`T-027-readability-check-test-file-added.md`). Precedents: `T-013-text-panel-test-file-added.md`, `T-017-panel-test-file-added.md`.

## Decision
Add a `ReadabilityCheck Fix` describe block (8 cases) to `src/editor/checks/ReadabilityCheck.test.tsx`. The cases render the component against the real store and check the store's undo history. The file's `photo` helper gains an optional `fit` argument, defaulting to `"fill"`, so the existing cases don't change.

## Alternatives
- **A separate `ReadabilityCheck.fix.test.tsx`:** it would duplicate the fast-average-color mock and the helpers.
- **No committed tests:** the undo-step criterion would go unchecked.

## Consequences
The test file joins T-035's `touches`.
