---
title: "T-028 adds src/editor/checks/useFitCheck.test.tsx for the fit hook's jsdom tests"
type: decision
project: captivator
ticket: T-028
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, fit, tests]
---
# T-028 adds src/editor/checks/useFitCheck.test.tsx for the fit hook's jsdom tests

## Context
T-028's `touches` lists `fit.ts`, its node test and `useFitCheck.tsx`. The spec leaves `ResizeObserver` measurement to the manual checklist, but the hook's wiring can be pinned without layout: the props it passes SplashPage (`landing`, `preview`, `compact`, no `inFrame`), the probe's hiding attributes and styles (an acceptance criterion), what it observes, how a reported height becomes `tooTall`, and cleanup. Precedent: `T-027-readability-check-test-file-added.md`.

## Decision
Add a co-located jsdom test, `src/editor/checks/useFitCheck.test.tsx` (6 cases). It mocks `SplashPage` with a bare root that records its props, stubs `ResizeObserver`, and sets the root's `scrollHeight` before firing the observer.

## Alternatives
- **No committed test:** a regression in the probe's hiding or the observer wiring wouldn't fail the build.
- **Cases in `PreviewStage.test.tsx`:** that file belongs to T-009 and mocks this hook.

## Consequences
The file joins T-028's `touches`. Real layout (five text blocks on Sponsor passing 600px) stays on T-029's manual checklist.
