---
title: "The small-phone fold line shows on the Landing and Error screens only"
type: decision
project: captivator
ticket: [T-009, T-028]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, fit]
---
# The small-phone fold line shows on the Landing and Error screens only

## Context
The ticket says `<PhoneFrame showFold={fit.tooTall}>`. The fold line is drawn in the phone's scroller at `z-index: 2`, above the isolated splash root, so on the Terms screen it would paint across the terms sheet and read as part of it. The fit check measures the landing page, so the line means nothing over the sheet or on the Connected screen.

## Decision
`PreviewStage` passes `showFold={fit.tooTall && (screen === "landing" || screen === "error")}`. The amber "Too tall for small phones" note under the frame still shows on every screen while `tooTall` is set.

## Alternatives
- **Fold on every screen, as written:** the dashed line crosses the terms sheet.
- **Lower the fold's z-index below the sheet:** the sheet sits inside the splash root's own stacking context, so nothing outside it can slot between the page and the sheet.

## Consequences
T-028 only supplies `tooTall`. T-022's Error screen, being the landing page with errors, keeps the line; Connected doesn't show it.
