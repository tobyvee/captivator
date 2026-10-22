---
title: "T-019 adds src/editor/TemplateCard.test.tsx for the card and picker page jsdom tests"
type: decision
project: captivator
ticket: T-019
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, picker, tests, hydration]
---
# T-019 adds src/editor/TemplateCard.test.tsx for the card and picker page jsdom tests

## Context
T-019's `touches` lists no test file, but its acceptance criteria are behaviour a test can pin: no hydration mismatch, the four cards, Use loading each template and opening `/editor`, Continue first only with a saved design, the confirm, keeping an uploaded logo, and credit link attributes. Precedent: `T-008-editor-test-file-added.md`, which also keeps the page's test out of `src/app/` because vinext scans it for routes.

## Decision
`src/editor/TemplateCard.test.tsx` (jsdom) covers `TemplateCard` and `src/app/page.tsx`. It mocks `next/navigation`'s `useRouter` with a `push` spy, spies on `window.confirm`, seeds `localStorage` under `STORAGE_KEY` for the saved-design cases, and resets the store and storage before each test as `editor.test.tsx` does. The hydration case uses `renderToString` and `hydrateRoot` with `onRecoverableError`, like the editor's.

## Alternatives
- **No committed test:** nothing would fail the build if the confirm, the Continue card or the hydration guard regressed.
- **`src/app/page.test.tsx`:** a non-route file in the app directory.

## Consequences
The file joins T-019's `touches`. Tests that render the page must keep mocking `next/navigation`, because the real `useRouter` needs a mounted app router.
