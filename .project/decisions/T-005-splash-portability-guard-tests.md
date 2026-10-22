---
title: "SplashPage tests guard the portability and no-HTML-injection rules for every file in src/splash"
type: decision
project: captivator
ticket: [T-005, T-006, T-007, T-021, T-022]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, security, tests]
---
# SplashPage tests guard the portability and no-HTML-injection rules for every file in src/splash

## Context
T-005's acceptance criteria require that `src/splash/` has no `dangerouslySetInnerHTML`, imports nothing from `next/*`, the editor or the store, and uses no class name except `cv-root` in export. The spec's test table doesn't list these cases, and the stubs T-005 creates will be replaced by four later tickets, so a one-off manual check would only cover today's files.

## Decision
`SplashPage.test.tsx` reads every non-test `.ts`/`.tsx` file under `src/splash/` and fails on `innerHTML`/`dangerouslySetInnerHTML` or an import from `next`, `editor/` or `lib/store`. It also renders each mode and asserts that `edit` and `preview` produce no `class` attribute anywhere and `export` produces exactly one (`cv-root` on the root).

## Alternatives
- **An ESLint `no-restricted-imports` rule for `src/splash`:** needs an `eslint.config.mjs` edit outside this ticket's `touches`; worth adding later alongside the test.
- **Manual review only:** the replacing tickets could regress the rule unnoticed.

## Consequences
T-006, T-007, T-021 and T-022 are held to these rules by `npm test` as soon as they replace their stub. Any splash file that needs a class (e.g. a focus style in the export `<style>` block) must go through a new decision and update this test.
