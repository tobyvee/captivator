---
title: "Sponsor, Terms sheet and Error screen behaviour is defined from existing schema fields"
type: decision
project: captivator
ticket: none
decided_by: user
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, splash]
---
# Sponsor, Terms sheet and Error screen behaviour is defined from existing schema fields

## Context
Review finding 10: the spec referenced a sponsor block that doesn't exist, Terms sheet colours undefined for photos or designs without headings, and an Error screen that assumed an email field.

## Decision
- **Sponsor block:** the second image block, with no new type.
- **Terms sheet:** its colour comes from the background's colour, gradient first stop or photo backdrop. Its text uses the first heading's colour if that passes contrast, otherwise `bestTextColour`.
- **Error screen:** shows the first field's error and "Please accept the terms" when terms are on. It is hidden from the switcher when nothing can fail.

## Alternatives
- Add a sponsor block type: a schema change for a single screen.

## Consequences
No schema change. Input colours were already in the schema (`form.inputBg`/`inputText`).
