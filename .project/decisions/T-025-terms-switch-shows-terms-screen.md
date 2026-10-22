---
title: "Turning terms on while Terms is selected switches the preview to the Terms screen, fixed in T-025's store change"
type: decision
project: captivator
ticket: [T-025, T-008]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, store, terms]
---
# Turning terms on while Terms is selected switches the preview to the Terms screen, fixed in T-025's store change

## Context
The T-008 review found a gap in `updateForm` (`src/lib/store.ts`). Selecting Terms while terms are off leaves `screen` on `landing`, which `screenFor` allows. When the customer then turns the Inspector header's "Show terms checkbox" switch on, the preview stays on Landing even though Terms is selected. `T-004-terms-selection-switches-screen.md` intends selecting Terms to show the Terms sheet. Only T-025 may edit `store.ts` (`T-004-store-owns-all-actions.md`).

## Decision
T-025 also changes `updateForm`: when `selection.kind === "terms"` and the patch turns `terms.mode` to `"checkbox"`, it sets `screen: "terms"`. A store test covers it.

## Alternatives
- Fix it now in `store.ts`: this breaks the single-owner rule while T-025 is still open.
- Have the Inspector call `setScreen("terms")` after the switch: this is panel logic deciding screens, which the store owns.

## Consequences
Until T-025 lands, the customer sees Landing after switching terms on while Terms is selected, and has to pick the Terms screen. T-025's scope grows by one small store change and its test.
