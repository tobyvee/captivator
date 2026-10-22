---
title: "T-008 adds src/editor/editor.test.tsx to its touches for the editor shell's jsdom tests"
type: decision
project: captivator
ticket: T-008
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests, hydration]
---
# T-008 adds src/editor/editor.test.tsx to its touches for the editor shell's jsdom tests

## Context
T-008's `touches` lists no test file, and the spec's test table has no editor case. But its acceptance criteria are behaviour that a test can pin: the skeleton on the server with no hydration mismatch, the name and design restored, `aria-pressed` on the device control, Delete falling back to Background, and `aria-checked` on the Terms switch. The ticket-implementer rules say to write tests with the code. Precedent: `T-004-hydration-test-file-added.md`.

## Decision
`src/editor/editor.test.tsx` (jsdom) covers the editor page, `TopBar` and `Inspector`. The hydration case renders `EditorPage` with `renderToString`, then hydrates that markup with `hydrateRoot` and asserts that `onRecoverableError` and `console.error` stay silent. React 19 reports mismatches through `onRecoverableError`, not `console.error`. The file lives in `src/editor/` rather than next to `page.tsx`, so `src/app/` holds only route files.

## Alternatives
- **No tests:** nothing would pin the hydration guard or the inspector's fallback.
- **`src/app/editor/page.test.tsx`:** puts a non-route file in the app directory, which vinext scans for routes.

## Consequences
The spec's "two jsdom component tests" is already exceeded (`Form`, `Background`, `TermsSheet`, store hydration). Later editor tickets can add cases here or create their own `*.test.tsx` beside their component. Those tests rely on the `beforeEach` reset of the store and `localStorage` that this file uses.
