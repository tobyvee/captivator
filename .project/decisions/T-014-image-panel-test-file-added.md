---
title: "T-014 adds src/editor/panels/ImagePanel.test.tsx for the Image panel's jsdom tests"
type: decision
project: captivator
ticket: T-014
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-014 adds src/editor/panels/ImagePanel.test.tsx for the Image panel's jsdom tests

## Context
T-014's `touches` lists only `ImagePanel.tsx`, and the spec's test table has no panel row. Its acceptance criteria are behaviour a test can pin: replace keeps alt and size, an emptied alt shows "Describe the image" without touching the store, and S/M/L sets the rendered height. No other ticket claims the file. Precedents: `T-008-editor-test-file-added.md`, `T-010-control-tests-added-on-landing.md`.

## Decision
Add a co-located jsdom test, `src/editor/panels/ImagePanel.test.tsx` (8 cases). It mocks `processUpload` and `extractPalette`, since the real pipeline needs a browser canvas, and checks the rendered height by rendering `SplashPage` from the store's design.

## Alternatives
- **No committed test:** a regression in the alt guard would drop or fail to save the alt without failing the build.
- **Add cases to `editor.test.tsx`:** that file belongs to T-008, and the panel's cases don't need the editor page.

## Consequences
The file joins T-014's `touches`. It relies on the same `beforeEach` store and `localStorage` reset as the other editor tests.
