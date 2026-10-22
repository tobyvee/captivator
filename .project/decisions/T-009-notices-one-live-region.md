---
title: "The preview's notices share one always-mounted status region"
type: decision
project: captivator
ticket: [T-009, T-028]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The preview's notices share one always-mounted status region

## Context
T-009 gave each notice (fit, save failure, restore failure) its own `role="status"`. The review pointed out that a live region mounted with its text already inside is often not announced, so these notices could go unheard.

## Decision
The notices render inside one `<div role="status">` that is always mounted. When it's empty, `empty:-mt-4` cancels the stage's 16px gap so the layout doesn't move.

## Alternatives
- **A live region per notice:** the announcement problem above.
- **`empty:hidden`:** a region that goes from `display: none` to shown isn't reliably announced either.
- **`aria-live` on the stage:** every preview change would be read out.

## Consequences
T-028's fit note stays inside this region. Its probe stays outside it, and should be out of flow so it doesn't add a gap.
