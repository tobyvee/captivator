---
title: "T-040: No HTML entities in the exported font declaration"
type: ticket
project: captivator
status: done
priority: P1
milestone: 9
estimate: 5
depends_on: []
touches:
  - src/splash/SplashPage.tsx
  - src/lib/export.ts
  - src/lib/export.test.ts
cut_rank:
updated: 2026-10-23
tags: [project, captivator, ticket, splash, export]
---
# T-040: No HTML entities in the exported font declaration

## Context
Reported by the user: "in the exported HTML the inline font-declaration uses html entities. I don't think it should." The root's style attribute read `font-family:system-ui, -apple-system, &quot;Segoe UI&quot;, Roboto, sans-serif`.

## Scope
- Unquote `Segoe UI` in `SplashPage`'s font stack and in the export's `body` rule.
- **Out of scope:** escaping of design text, which must stay.

## Acceptance criteria
- [x] No template's exported style attributes contain an HTML entity. A new test checks this, and it fails against the old font stack.
- [x] The exported root's font is `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`.
- [x] Escaping tests for design text and the name still pass.
- [x] `npm test`, `npx tsc --noEmit` and `npm run lint` pass.

## Outcome
The exported markup has no `&quot;` in its styles. 883 tests pass.

## Decisions
- [`T-040-font-stack-unquoted.md`](../decisions/T-040-font-stack-unquoted.md): The splash font stack names Segoe UI without quotes
