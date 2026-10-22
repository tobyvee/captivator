---
title: "T-016 adds src/editor/panels/BackgroundPanel.test.tsx for the panel's jsdom tests"
type: decision
project: captivator
ticket: T-016
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-016 adds src/editor/panels/BackgroundPanel.test.tsx for the panel's jsdom tests

## Context
T-016's `touches` lists no test file and the spec's test table has no panel row, but the tab conversions, the "never store a photo without a `src`" rule and the upload paths are logic a test can pin. `T-008-editor-test-file-added.md` says later editor tickets can create their own `*.test.tsx` beside their component, and no other ticket claims this file.

## Decision
`src/editor/panels/BackgroundPanel.test.tsx` (jsdom, 12 cases) covers each tab conversion, both gradient stops and all three directions, Photo without a photo leaving the store untouched, upload creating a photo or replacing only `src` and dropping the credit, the credit line, and the tab following outside changes. `processUpload` is mocked through `vi.mock("@/lib/images")`, because jsdom has no canvas; the rest of `ImageUpload` runs as is.

## Alternatives
- **No committed tests:** a regression in the conversions wouldn't fail the build.
- **Cases in `src/editor/editor.test.tsx`:** owned by T-008, and parallel panel tickets would collide on it.

## Consequences
The real downscale (a 1600px+ photo stored as a smaller data URL) is still covered only by `images.test.ts` and T-029's manual check.
