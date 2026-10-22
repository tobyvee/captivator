---
title: "T-027 adds src/editor/checks/ReadabilityCheck.test.tsx for the readability line's jsdom tests"
type: decision
project: captivator
ticket: T-027
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, tests, contrast]
---
# T-027 adds src/editor/checks/ReadabilityCheck.test.tsx for the readability line's jsdom tests

## Context
T-027's `touches` lists `readability.ts`, its node test and `ReadabilityCheck.tsx`. The component does things the pure test can't reach: it samples the photo's average with fast-average-color, caches it by `src`, falls back when sampling fails, and keeps one status region mounted. Precedents: `T-013-text-panel-test-file-added.md`, `T-017-panel-test-file-added.md`.

## Decision
Add a co-located jsdom test, `src/editor/checks/ReadabilityCheck.test.tsx` (6 cases). It mocks `fast-average-color`, because jsdom can't draw images. Each case uses its own photo `src`, since the cache lasts as long as the module.

## Alternatives
- **No committed test:** a regression in the photo sampling or the cache wouldn't fail the build.
- **Add cases to `PreviewStage.test.tsx`:** that file belongs to T-009, and these cases don't need the stage.

## Consequences
The file joins T-027's `touches`.
