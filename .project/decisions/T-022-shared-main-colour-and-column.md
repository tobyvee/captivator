---
title: "The background's main colour and the guest column are shared helpers, mainBackgroundColour in lib/contrast and COLUMN in splash/layout"
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes: T-022-connected-text-colours-and-copy.md
updated: 2026-10-23
tags: [project, captivator, decision, splash, contrast]
---
# The background's main colour and the guest column are shared helpers, mainBackgroundColour in lib/contrast and COLUMN in splash/layout

## Context
T-022 code review, should-fix. `T-022-connected-text-colours-and-copy.md` gave `Connected.tsx` its own copy of the terms sheet's main-colour rule, because the sheet's helper wasn't exported and `TermsSheet.tsx` was outside T-022's `touches`. `Connected.tsx` also copied SplashPage's `COLUMN` style. Two copies of one rule drift apart.

## Decision
- `mainBackgroundColour(bg)` in `src/lib/contrast.ts` (colour, gradient `from` or photo `backdrop`) replaces `sheetColour` in `TermsSheet.tsx` and `mainColour` in `Connected.tsx`.
- `COLUMN` moves to a new `src/splash/layout.ts`, imported by `SplashPage.tsx` and `Connected.tsx`. A separate module avoids the cycle that importing it from `SplashPage.tsx` into `Connected.tsx` would create.
- SplashPage's markup is byte-identical before and after for every template, each with its own form, with two fields and terms, and with nothing that can fail, in every mode and screen.

The other rules of the superseded decision still apply:
- "Thanks to our sponsor" is 15px/500 in `bestTextColour(backgroundColours(background))`.
- The heading reads "You're online" in sentence case, with no `textTransform`.
- CONTINUE uses the column's 18px gap and adds no margin.

## Alternatives
- **Export `sheetColour` from `TermsSheet.tsx`:** Connected would depend on the sheet module for a background rule, which belongs with the other background colour helpers.
- **Export `COLUMN` from `SplashPage.tsx`:** SplashPage imports Connected, so Connected importing SplashPage is a cycle.

## Consequences
The sheet and the Connected tick can't disagree about the page's main colour. `src/editor/panels/BackgroundPanel.tsx` still has its own `mainColour` with the same rule; it could use the shared helper in a later change.
