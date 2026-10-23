---
title: "T-044: No template opens with the small-phone warning"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 10
depends_on: []
touches:
  - src/splash/layout.ts
  - src/lib/templates.test.ts
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, splash, templates, fit]
---
# T-044: No template opens with the small-phone warning

## Context
The user: "I don't think we should default to a template which shows the small phone warning, in fact none of the templates should show the warning in their initial state." Sponsor, the default, measured 602.5px in Chrome against the 600px limit. The user chose to tighten the page spacing.

## Scope
- Tighten the guest page column's gap and top padding.
- Make the templates test require 20px of headroom.

## Acceptance criteria
- [x] Opening each template fresh in Chrome shows no fit warning: Sponsor 578.5, Photo hero 437.2, Minimal 390, Blank 138 (px, measured by the fit probe at 1440 × 950).
- [x] The templates test keeps every template's estimate at or under 580px.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass. Code review and the splash audit have run.

## Outcome
Every template opens with about 20px of room under the fit limit. 887 tests pass.

## Decisions
- [`T-044-tighter-column-spacing.md`](../decisions/T-044-tighter-column-spacing.md): Templates must open without the fit warning, made room for by tightening the guest page's spacing
- [`T-044-spacing-values-and-headroom.md`](../decisions/T-044-spacing-values-and-headroom.md): The column gap is 14px and its top padding 48px, and every template keeps 20px of fit headroom
