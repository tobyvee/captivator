---
title: "The picker page chooses each card's outline or solid variant; the Continue card is still a TemplateCard"
type: decision
project: captivator
ticket: T-019
decided_by: main session
supersedes: T-019-continue-card-is-a-template-card.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, templates]
---
# The picker page chooses each card's outline or solid variant; the Continue card is still a TemplateCard

## Context
The code review of T-019 found Blank special-cased by id in two places: the page picked its "Start blank" label, and `TemplateCard` styled `id === "blank"` as the canvas's dashed card with an outline button. That forced the Continue card's made-up `"saved"` id to avoid `"blank"` (`T-019-continue-card-is-a-template-card.md`, Consequences). The `Templates` artboard confirms Blank's styling: dashed `#A1A1AA` card on `#FAFAFA`, `#D4D4D8` frame, outline "Start blank" button.

## Decision
`TemplateCard` takes `variant?: "solid" | "outline"` (default solid). The page sets `outline` for Blank, next to where it picks Blank's label. The Continue card is unchanged from the superseded decision: a `TemplateCard` with `{ id: "saved", name: "Continue your design", description: <name or "Untitled design">, design }`, `primaryLabel="Continue"`, first in the grid, no credit.

## Alternatives
- **Keep styling by id:** knowledge of Blank in two files, and an id the Continue card must dodge.

## Consequences
`TemplateCard` no longer imports `BLANK`, and the `"saved"` id is only a React key. Any future card that wants the outline look passes the variant.
