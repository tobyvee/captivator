---
title: "The Text panel takes the role weights from the splash renderer's exported WEIGHT"
type: decision
project: captivator
ticket: [T-013, T-005, T-027]
decided_by: main session
supersedes: T-013-role-weights-local-copy.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, splash, contrast]
---
# The Text panel takes the role weights from the splash renderer's exported WEIGHT

## Context
`T-013-role-weights-local-copy.md` kept a copy of the role weights (800 / 500 / 400) in `TextPanel.tsx`, only because `src/splash/blocks/TextBlock.tsx` was outside T-013's `touches`. The T-013 review pointed out that `TextBlock.tsx` belongs to T-005, which is done, and no open ticket claims it. Wave 5 already exported `ANGLE` and `profileHref` from the splash renderer the same way. T-027's readability check needs the same map, which would make three copies.

## Decision
`TextBlock.tsx` exports `WEIGHT` with a one-line comment, and `TextPanel.tsx` imports it. Nothing in the renderer changes.

## Alternatives
- **Keep the copy:** a change of weight in the renderer would silently desync the contrast check.
- **Move the map to `src/lib/`:** the renderer owns the weights it draws with.

## Consequences
T-027 imports `WEIGHT` from `@/splash/blocks/TextBlock` (lib and editor importing splash is the allowed direction; `export.ts` already does). The splash renderer still imports nothing from the editor.
