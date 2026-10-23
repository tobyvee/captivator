---
title: "The editor has no contrast check; the customer judges readability themselves"
type: decision
project: captivator
ticket: T-046
decided_by: user
supersedes:
  - general-photo-contrast-approximate.md
  - T-013-panels-show-contrast-line.md
  - T-013-contrast-verdict-live-region.md
  - T-013-photo-line-never-rates.md
  - T-020-panels-share-rate-text.md
  - T-027-readability-verdict-live-only.md
  - T-027-fitted-photo-checks-backdrop.md
  - T-027-photo-average-cache.md
  - T-027-outline-button-message-on-background.md
  - T-027-input-edge-contrast.md
  - T-035-failure-carries-colours.md
  - T-035-fix-ignores-repeat-clicks.md
  - T-035-fix-first-fixable-failure.md
  - T-037-failure-notice-under-caption.md
updated: 2026-10-23
tags: [project, captivator, decision, contrast, editor]
---
# The editor has no contrast check; the customer judges readability themselves

## Context
CLAUDE.md and the spec listed a WCAG contrast check (4.5:1, or 3:1 for large text) that warns but never blocks. It shipped as a line in the Text and Terms panels, a readability notice beside the preview caption and a one-tap Fix (T-013, T-020, T-027, T-035, T-037). The user: "Let's remove the WACG contrast checker. It's too confusing for the user and tbh they can make a bad design if that's what they want."

## Decision
Remove the editor's contrast check entirely: the panel lines, the preview notice, the Fix, and the modules behind them (`readability.ts`, `ReadabilityCheck.tsx`). `contrast.ts` stays, because the renderer still uses it to pick its own colours (the terms sheet heading, error text and the Connected screen). Its photo-average parameter, which only the check passed, goes too.

## Alternatives
- **Keep the check but simplify its wording:** the user's reason is also that a customer may choose a bad design, so any warning is unwanted.
- **Hide it behind a toggle:** adds a setting for something the user doesn't want shown.

## Consequences
The fit check is the editor's only check. Templates still pass contrast, because their tests check the input edges (`templates.test.ts`), but nothing warns when a customer picks unreadable colours. The README and CLAUDE.md no longer describe a contrast check. The phone checklist's "white on white" row passed before the removal and stays as a record.
