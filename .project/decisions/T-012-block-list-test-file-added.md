---
title: "T-012 adds src/editor/BlockList.test.tsx for the block list's jsdom tests"
type: decision
project: captivator
ticket: T-012
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-012 adds src/editor/BlockList.test.tsx for the block list's jsdom tests

## Context
T-012's `touches` lists only `BlockList.tsx`, and the spec's test table has no block-list row. Its acceptance criteria are behaviour a test can pin: add, the image limit, reorder with disabled ends, the Terms switch, summaries and Tab order. The caller allowed a co-located test file that no other ticket claims. Precedents: `T-008-editor-test-file-added.md`, `T-010-control-tests-added-on-landing.md`.

## Decision
`src/editor/BlockList.test.tsx` (jsdom, 11 cases) renders `BlockList` beside a `SplashPage` fed from the store, so "shows in the preview" is checked against the real renderer's output. `processUpload` is mocked; nothing decodes images.

## Alternatives
- **Cases in `editor.test.tsx`:** that file belongs to T-008, so parallel tickets would share a file.
- **No committed tests:** the acceptance criteria would have no regression net.

## Consequences
T-012's `touches` grows by one test file. T-034 (drag to reorder) can add its cases here.
