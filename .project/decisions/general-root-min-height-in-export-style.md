---
title: "The root min-height pair lives in the export style block"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-21
tags: [project, captivator, decision, splash]
---
# The root min-height pair lives in the export style block

## Context
Review finding 1 (`.project/review/2026-10-21-prd-and-spec-review.md`): `min-height: 100vh; min-height: 100dvh` needs a duplicate property, which a React inline style object can't hold.

## Decision
In `export` mode the root gets `class="cv-root"`, and the export's single `<style>` block sets `.cv-root { min-height: 100vh; min-height: 100dvh }`. Editor frames keep `height: 100%` via `inFrame`.

## Alternatives
- `minHeight: '100dvh'` inline with a stated iOS 15.4 minimum: older WebKit would lose the full-height layout.
- `100vh` only: overshoots under mobile Safari's toolbar.

## Consequences
The renderer stays inline-only apart from one class name. The `<style>` block is now the home for any rule that inline styles can't express (e.g. focus styles).
