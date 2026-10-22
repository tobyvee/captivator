---
title: "The SplashPage skeleton owns composition and creates every child component as a stub"
type: decision
project: captivator
ticket: [T-005, T-006, T-007, T-021, T-022]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, planning]
---
# The SplashPage skeleton owns composition and creates every child component as a stub

## Context
`SplashPage.tsx` is the integration point for Background, Form, TermsSheet and Connected. The planner rules give each splash part its own ticket, but parallel tickets can't compile against files that don't exist yet.

## Decision
- **T-005 owns `SplashPage.tsx`:** layout, screens, render modes and edit-mode selection chrome. It also writes `TextBlock` and `ImageBlock`.
- **Stubs:** T-005 creates `Background`, `Form`, `TermsSheet` and `Connected` as stubs with their final props.
- **Replacements:** T-006, T-007, T-021 and T-022 each replace one stub and never edit `SplashPage.tsx`.

## Alternatives
- **A wiring ticket after the parts:** adds a serial step.
- **Separate tickets for TextBlock and ImageBlock:** each is well under 10 minutes.

## Consequences
The child prop signatures in T-005 are a contract. A ticket that needs a different prop reports it rather than changing it.
