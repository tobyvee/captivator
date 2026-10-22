---
title: "The carry rule's template defaults include the template being loaded"
type: decision
project: captivator
ticket: T-004
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, templates]
---
# The carry rule's template defaults include the template being loaded

## Context
`T-004-template-switch-carry-rule.md` builds `defaults` from every template in `TEMPLATES`. `loadTemplate(template)` takes any `Template`, and the tests use fixture templates that aren't in `TEMPLATES`.

## Decision
`defaults` is the text strings and image `src`s (blocks and photo backgrounds) of every template in `TEMPLATES` **plus** the template passed to `loadTemplate`.

## Alternatives
- **`TEMPLATES` only:** identical for real templates, which are all in `TEMPLATES`, but a template outside the list could carry its own copy back into itself.

## Consequences
No behaviour change for the shipped templates. Templates added in T-018 are covered automatically once they're in `TEMPLATES`.
