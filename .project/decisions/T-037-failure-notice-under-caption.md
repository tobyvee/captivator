---
title: "A failing readability Notice wraps under the preview caption; the passing line stays beside it"
type: decision
project: captivator
ticket: T-037
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast, layout]
---
# A failing readability Notice wraps under the preview caption; the passing line stays beside it

## Context
The caption row under the preview is a centred, wrapping flex row holding the size caption and `ReadabilityCheck`. When the check fails, its amber Notice sat beside "375 × 740, iPhone login sheet". The user asked for it to stack: "The layout here should stack". The `Main` artboard draws only the passing state, a short green line inline beside the caption ([`T-027-line-states-and-notice.md`](T-027-line-states-and-notice.md)).

## Decision
`ReadabilityCheck`'s wrapper takes the row's full width (`basis-full`) only when the check fails, so the Notice wraps onto its own line under the caption. The Notice is `w-full max-w-[420px]`, the width of the fit Notice stacked below it. The passing and approximate lines stay inline, as on the canvas.

## Alternatives
- **Always stack the row (`flex-col`):** also moves the short passing line under the caption, which departs from the canvas for no gain.
- **Move the Notice out of the caption row into the stage's notice stack:** splits `ReadabilityCheck`'s one live region across two places, or needs `PreviewStage` to know the verdict.

## Consequences
The caption row's layout now depends on the verdict: a fix that turns the check from failing to passing moves the line back beside the caption.
