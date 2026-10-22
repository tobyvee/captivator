---
title: "SplashPage, not Background, renders the photo credit, after the content column"
type: decision
project: captivator
ticket: [T-006, T-005]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, accessibility]
---
# SplashPage, not Background, renders the photo credit, after the content column

## Context
T-006 rendered the Unsplash credit inside `Background`, and SplashPage renders `Background` before the content column. The T-006 splash audit found that this put "Photo: … / Unsplash" and its links before the page heading and the form in reading and tab order (WCAG 1.3.2, 2.4.3). `T-005-splashpage-skeleton-creates-stubs.md` says the tickets that replace T-005's stubs only edit their own file. Moving the credit means editing `SplashPage.tsx`, which no open ticket claims.

## Decision
`Background.tsx` exports `Credit({ credit, mode })`, and `Background` renders only the layers. `SplashPage.tsx` renders the credit after the column on the landing, terms and error screens, after `Connected` on the connected screen, and before the export's `TermsSheet`. `SplashPage.tsx` and `SplashPage.test.tsx` join T-006's `touches`, as a one-off exception to the T-005 decision.

## Alternatives
- Render `Background` after the column: this changes the root's paint order, and the layers would need extra z-index rules.
- Keep the credit first and add `tabindex="-1"`: this hides the links from keyboard users and leaves the reading order wrong.

## Consequences
- The credit keeps `z-index: 2` in the root's stacking context, so T-021's sheet, also z-index 2 but later in the DOM, paints over it.
- On the terms screen it sits inside the inert, aria-hidden landing wrapper.
- Later tickets that replace a stub still don't edit `SplashPage.tsx` without logging an exception like this one.
