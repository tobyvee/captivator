---
title: "T-009 adds src/editor/PreviewStage.test.tsx to its touches for the preview stage's jsdom tests"
type: decision
project: captivator
ticket: T-009
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-009 adds src/editor/PreviewStage.test.tsx to its touches for the preview stage's jsdom tests

## Context
T-009's `touches` lists no test file, and the spec's test table has no preview-stage case. But most of its acceptance criteria can be pinned in jsdom: the preview following store changes, click-to-select, the Landing/Terms switcher, the save and restore notices, the captions, and where each frame puts the terms sheet's containing block. Precedents: `T-008-editor-test-file-added.md` and `T-010-control-tests-added-on-landing.md`. No other ticket claims this file.

## Decision
`src/editor/PreviewStage.test.tsx` (jsdom, 11 cases) covers `PreviewStage`, `PhoneFrame`, `BrowserFrame` and `ScreenSwitcher` through the rendered stage. It mocks `useFitCheck` to drive `tooTall`, and stubs `ResizeObserver` to check the browser frame's scale and reserved height.

## Alternatives
- **No tests:** nothing would pin the frames' containing blocks, which the terms sheet depends on.
- **Cases in `editor.test.tsx`:** T-008 owns that file.

## Consequences
T-022, T-027 and T-028 can add cases here. T-028 should drop or adapt the `useFitCheck` mock once the hook is real; the fold and note cases only need `tooTall` to be true.
