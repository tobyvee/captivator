---
title: "TermsSheet uses a fixed title id and no hooks, so node tests can reach its click handlers"
type: decision
project: captivator
ticket: T-021
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash, terms, tests]
---
# TermsSheet uses a fixed title id and no hooks, so node tests can reach its click handlers

## Context
The ticket asks for `aria-labelledby` in every mode, a fixed `cv-terms-title` in export, and a node-environment test (`renderToStaticMarkup`) that also proves the dim layer, × and CLOSE call `onClose` (`T-021-dim-layer-closes-sheet.md`). Static markup can't be clicked, and the test conventions allow jsdom in at most one more component test file.

## Decision
The title id is `cv-terms-title` in all modes, and `TermsSheet` uses no hooks. The test calls `TermsSheet(props)` directly, walks the returned element tree and invokes each `onClick`.

## Alternatives
- **`useId()` for edit and preview:** unique ids, but a hook makes the direct call invalid, forcing jsdom for the click test.
- **jsdom for this file:** spends the conventions' one extra jsdom file and departs from the ticket's node environment.

## Consequences
Only one open sheet may be on a page at a time, which holds today: only the editor preview renders `screen="terms"`, and thumbnails and the fit check render landing. A later consumer rendering two open sheets together would need unique ids. Adding a hook to `TermsSheet` would break the click test's approach.
