---
title: "The user accepted the remaining real-device checks as skipped, closing wave 11"
type: decision
project: captivator
ticket: [T-030, T-029, T-036, T-038]
decided_by: user
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, testing, checklist]
---
# The user accepted the remaining real-device checks as skipped, closing wave 11

## Context
Wave 11 ends with T-030's manual check that the production URL loads on mobile data. Several real-device checks were still open:
- the T-036 and T-041 re-check (Unsplash results in the deployed editor);
- the T-038 re-check (an export on the Android phone);
- the checklist items skipped in T-029 ([`T-029-skipped-checks-unverified.md`](T-029-skipped-checks-unverified.md)).

The user answered: mobile data "It works"; the Unsplash re-check "Works"; the Android re-check "SKip"; and the remaining skipped items "Accept as skipped".

## Decision
- Record the mobile-data check and the Unsplash re-check as passes.
- Record the Android re-check of T-038 as skipped.
- Accept the six checklist items still skipped as unverified. Their unit tests are the only evidence.
- Also covered: T-036's criterion 6 (the popover, block drag auto-scroll and toast), which wasn't run on its own.
- Wave 11 is closed.

## Alternatives
- **Keep the wave open until every check runs:** the user chose not to.

## Consequences
The README's known gaps list the six unverified items and the unchecked T-038 fix. A real-device pass on iOS and Android, including a real login sheet, stays the first next step.
