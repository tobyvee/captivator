---
title: "In edit mode, Connect selects the button and, once the guest screens exist, also validates and shows Error or Connected"
type: decision
project: captivator
ticket: [T-007, T-022]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash]
---
# In edit mode, Connect selects the button and, once the guest screens exist, also validates and shows Error or Connected

## Context
Three things pull different ways:
- The render-mode table says edit-mode Connect "validates, then shows Error or Connected".
- The canvas tip says "tap anything in the preview to edit it".
- The Error and Connected screens are cuttable (cut order item 3).

## Decision
- **T-007:** edit-mode Connect selects the Connect row.
- **T-022:** keeps that, then validates the preview's own inputs and switches to Error or Connected.

## Alternatives
- **Connect only validates:** the button can't be selected from the preview.
- **Validation in T-007:** dead code if the guest screens are cut.

## Consequences
If T-022 is cut, Connect stays a select-only button, which is consistent with the canvas tip.
