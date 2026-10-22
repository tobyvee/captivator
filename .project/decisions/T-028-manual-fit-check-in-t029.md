---
title: "The five-text-block fit check runs in a real browser in T-029"
type: decision
project: captivator
ticket: [T-028, T-029]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, fit, testing]
---
# The five-text-block fit check runs in a real browser in T-029

## Context
T-028's spec-checklist criterion ("adding five text blocks to Sponsor shows the fit warning and the fold line; removing them clears it") needs real layout, which jsdom doesn't have. The unit tests cover the 600px decision, the probe's props and styles, observing the real splash root, and `PreviewStage` drawing the line and note from `tooTall`.

## Decision
Tick it on those tests and the agent's headless-Chrome measurement (Sponsor at 599px), and add the browser check to T-029's checklist, with the Sponsor checks from `T-028-sponsor-one-pixel-inside-fold.md`.

## Alternatives
- **Leave it open until T-029:** blocks recording a finished check for a step the checklist already runs, as with `T-026-manual-palette-check-in-t029.md`.

## Consequences
T-029 gains the fit check's browser steps.
