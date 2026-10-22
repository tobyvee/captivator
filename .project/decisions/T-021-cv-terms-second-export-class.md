---
title: "The export's terms section carries class cv-terms, a second allowed class beside cv-root"
type: decision
project: captivator
ticket: [T-021, T-023, T-005]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, export, tests]
---
# The export's terms section carries class cv-terms, a second allowed class beside cv-root

## Context
`T-005-splash-portability-guard-tests.md` says the export renders no class except `cv-root`, and that a splash file needing another class goes through a new decision and updates the guard in `SplashPage.test.tsx`. T-021's ticket specifies `<section id="terms" class="cv-terms">`, and T-023's `<style>` block is written against it (`.cv-terms{display:none}.cv-terms:target{display:block}`). `SplashPage.test.tsx` is not in T-021's `touches`.

## Decision
Keep `class="cv-terms"` on the export section, as the ticket and T-023 require. `cv-root` and `cv-terms` are the only two classes the export may render. `TermsSheet.test.tsx` asserts that the sheet's export markup has exactly one class (`cv-terms`) and that edit and preview render none.

## Alternatives
- **An id selector (`#terms:target`) and no class:** satisfies the existing guard, but breaks T-023's ticket text and its planned CSS.
- **Edit the guard in `SplashPage.test.tsx` now:** outside this ticket's `touches`.

## Consequences
The guard's "exactly one class in export" test still passes because its fixture has terms off. Whoever next owns `SplashPage.test.tsx` should widen it to allow exactly `cv-root` plus `cv-terms` (with terms on), so a terms-on export is guarded too.
