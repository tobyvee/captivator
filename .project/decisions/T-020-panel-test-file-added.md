---
title: "T-020 adds TermsPanel.test.tsx for the panel's jsdom tests"
type: decision
project: captivator
ticket: T-020
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, testing]
---
# T-020 adds TermsPanel.test.tsx for the panel's jsdom tests

## Context
T-020's `touches` lists only `src/editor/panels/TermsPanel.tsx`, and the spec's test table has no panel row. Its acceptance criteria (wording updates the preview and sample per keystroke, the 8,000-character body with its counter, "Required" keeping the stored value, a plain textarea, keyboard reach) are behaviour a test can pin. `general-inspector-test-leaves-panels-to-their-tests.md` makes each panel's own test file the place its body is covered; precedents are `T-015-panel-test-files-added.md` and `T-016-panel-test-file-added.md`.

## Decision
Add a co-located jsdom test, `src/editor/panels/TermsPanel.test.tsx` (17 cases), driven with `userEvent.setup()`, checking the preview by rendering `SplashPage` from the store's design, including the Terms sheet's paragraph split.

## Alternatives
- **No committed tests:** a regression in the required-draft wiring or the body limit wouldn't fail the build.
- **Cases in `src/editor/editor.test.tsx`:** owned by T-008, and parallel panel tickets would collide on it.

## Consequences
The file joins T-020's `touches`. It relies on the same `beforeEach` store and `localStorage` reset as the other panel tests.
