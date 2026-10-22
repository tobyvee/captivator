---
title: "T-017 adds src/editor/panels/PhotoAdjustments.test.tsx for the photo panel's and FocusGrid's jsdom tests"
type: decision
project: captivator
ticket: T-017
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests]
---
# T-017 adds src/editor/panels/PhotoAdjustments.test.tsx for the photo panel's and FocusGrid's jsdom tests

## Context
T-017's `touches` lists only `PhotoAdjustments.tsx` and `FocusGrid.tsx`, and the spec's test table has no panel row. The slider-to-schema mappings (zoom 100–200% to 1–2, darken 0–85% to opacity), creating a black overlay when there is none, and the nearest-preset rule are logic a test can pin. `T-008-editor-test-file-added.md` and `T-016-panel-test-file-added.md` set the pattern of a co-located test file per panel, and `general-inspector-test-leaves-panels-to-their-tests.md` leaves panel bodies to those files.

## Decision
`src/editor/panels/PhotoAdjustments.test.tsx` (jsdom, 15 cases) covers both modules: nothing rendered for a non-photo background, Fill/Show whole switching (Zoom swapped for the backdrop colour), backdrop edit, zoom mapping, focus presets and the pressed square, darken mapping with kept overlay colours, a new black overlay, and the budget note shown only for data-URL photos. FocusGrid gets its own cases for the nine labels in reading order, their points, and the nearest-preset `aria-pressed`.

## Alternatives
- **No committed tests:** a regression in the mappings wouldn't fail the build.
- **Cases in `BackgroundPanel.test.tsx` or `editor.test.tsx`:** owned by T-016 and T-008.

## Consequences
The rendered `object-fit`, `object-position` and `transform-origin` in the preview are covered by the splash renderer's tests (T-006), not here. T-033 extends this file when it adds the drag dot.
