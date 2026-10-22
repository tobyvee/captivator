---
title: "T-024 adds src/editor/ExportButton.test.tsx for the Export button's jsdom tests"
type: decision
project: captivator
ticket: T-024
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, export, tests]
---
# T-024 adds src/editor/ExportButton.test.tsx for the Export button's jsdom tests

## Context
T-024's `touches` lists only `src/editor/ExportButton.tsx`, but its acceptance criteria (busy and disabled while exporting, the size toast, over budget still downloading, never stuck busy) are behaviour a test can pin. `T-008-editor-test-file-added.md` lets later editor tickets create their own `*.test.tsx` beside their component, and `src/editor/editor.test.tsx` belongs to T-008.

## Decision
`src/editor/ExportButton.test.tsx` (jsdom) mocks `buildExportHtml` and `downloadHtml` from `@/lib/export` (jsdom has no canvas, image fetch or blob download) and keeps the rest of the module real, so `ExportError`, `exportFileName` and `PAGE_BUDGET` are the shipped ones. The toast timer tests use `vi.useFakeTimers({ shouldAdvanceTime: true })`, because plain fake timers stall `userEvent`.

## Alternatives
- **Add cases to `editor.test.tsx`:** another ticket's file, outside `touches`.
- **No tests:** nothing would pin the busy reset on failure or the text-only error message.

## Consequences
`editor.test.tsx`'s "Export HTML is disabled until its ticket lands" assertion now fails and must be updated by the main session when this lands. The real HTML is covered by `src/lib/export.test.ts`; opening the file in a browser stays a manual check (T-029).
