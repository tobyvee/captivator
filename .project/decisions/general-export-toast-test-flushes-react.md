---
title: "The export button's tests flush React after each export click"
type: decision
project: captivator
ticket: T-024
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, testing, export, ci]
---
# The export button's tests flush React after each export click

## Context
The deploy run for the milestone 8 record failed on `ExportButton.test.tsx` ("still downloads over budget, and warns until dismissed"): the download had been called but the status was still empty. The next run, with identical code, passed. `ExportButton` sets its toast after awaiting the build, which resumes outside the click's `act`, so on a loaded CI runner the assertion could run before React rendered the update. A flaky test blocks the deploy, because the workflow builds with `vitest run`.

## Decision
The six tests that assert right after an export click use an `exportNow(user)` helper that clicks and then awaits `act(async () => {})`, flushing React before the assertion. The component is unchanged.

## Alternatives
- **`vi.waitFor` around each assertion:** also works, but polls and advances the fake clock, which the toast-timer tests depend on.
- **Retry flaky tests in CI:** hides the race instead of removing it.

## Consequences
New tests in that file should use `exportNow` for any export click whose result they assert straight away.
