---
title: "T-013 adds src/editor/panels/TextPanel.test.tsx for the Text panel's jsdom tests"
type: decision
project: captivator
ticket: T-013
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-013 adds src/editor/panels/TextPanel.test.tsx for the Text panel's jsdom tests

## Context
T-013's `touches` lists only `TextPanel.tsx`, and the spec's test table has no panel row. Its acceptance criteria are behaviour a test can pin: live preview updates, the 120-character stop and counter, presets setting role and size, the 12–56 slider, and "Hard to read" for white on white. `general-inspector-test-leaves-panels-to-their-tests.md` puts panel bodies in their own test files. Precedents: `T-014-image-panel-test-file-added.md`, `T-016-panel-test-file-added.md`.

## Decision
Add a co-located jsdom test, `src/editor/panels/TextPanel.test.tsx` (16 cases). It drives the real store and checks the preview by rendering `SplashPage` from the store's design next to the panel.

## Alternatives
- **No committed test:** a regression in the presets or the contrast line wouldn't fail the build.
- **Add cases to `editor.test.tsx`:** that file belongs to T-008, and the panel's cases don't need the editor page.

## Consequences
The file joins T-013's `touches`. It relies on the same `beforeEach` store and `localStorage` reset as the other editor tests.
