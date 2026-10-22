---
title: "Picker thumbnails are inert as well as aria-hidden, and card credits link through profileHref"
type: decision
project: captivator
ticket: T-019
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, picker, accessibility, splash]
---
# Picker thumbnails are inert as well as aria-hidden, and card credits link through profileHref

## Context
T-019 gives the thumbnail `aria-hidden` and `pointer-events: none`. But `SplashPage` in preview mode renders inputs, the Terms link button and the Connect button, and `aria-hidden` doesn't remove them from the Tab order, so keyboard users would tab through every hidden field and button in every thumbnail. The card's credit links come from `TEMPLATE_CREDITS`, and `src/splash/Background.tsx` already exports `profileHref` and `UNSPLASH_HOME` for linking credits (`T-016-credit-href-shared-with-splash.md`).

## Decision
- The mini-frame carries `aria-hidden="true"`, `inert` and `pointer-events: none`. `SplashPage` already uses `inert` under the terms sheet, so the minimum targets support it.
- The photographer link is `profileHref(credit.profileUrl)`, rendering the name as plain text if that returns `null`. The Unsplash link is `UNSPLASH_HOME`. Both have `target="_blank"` and `rel="noopener noreferrer"`.

## Alternatives
- **`aria-hidden` only:** focusable content inside an `aria-hidden` subtree.
- **`tabIndex={-1}` on the thumbnail's controls:** needs a new `SplashPage` prop, which forks rendering for one consumer.
- **Link `credit.profileUrl` directly:** a second copy of the credit link rule, which T-016's review rejected.

## Consequences
The cards have exactly one focusable button each, plus the credit links. A change to the credit link rule in `Background.tsx` applies to the picker too.
