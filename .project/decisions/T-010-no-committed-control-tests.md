---
title: "T-010 commits no test file; its behaviour was checked with a throwaway jsdom test"
type: decision
project: captivator
ticket: T-010
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, tests, editor]
---
# T-010 commits no test file; its behaviour was checked with a throwaway jsdom test

## Context
T-010's `touches` lists only `ColourField.tsx` and `Slider.tsx`, and the spec's unit-test table has no row for editor controls. The test conventions also limit jsdom component tests.

## Decision
No test file is committed. The acceptance criteria (hex commit and revert, `abc123` to `#ABC123`, Escape and outside-click closing, focus return, Tab order, logo row hidden until `setLogoPalette`, picker keys calling `onChange` with uppercase hex, Slider `aria-valuetext`) were checked with a temporary jsdom test that was deleted before commit.

## Alternatives
- **Add `ColourField.test.tsx`:** outside `touches`, so it would need the main session to widen the ticket.

## Consequences
A regression in these controls won't fail the build. If the main session wants coverage, a follow-up ticket can add `src/editor/controls/ColourField.test.tsx` from the cases above.
