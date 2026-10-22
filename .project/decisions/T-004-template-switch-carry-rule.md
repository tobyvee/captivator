---
title: "Switching template carries text and uploaded images by position, never template defaults"
type: decision
project: captivator
ticket: [T-004, T-019]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, templates]
---
# Switching template carries text and uploaded images by position, never template defaults

## Context
The spec says switching template keeps the customer's uploaded images and text "where the new template has a block of the same kind". The store can't tell customer content from template copy. A naive carry would leak Sponsor's "FREE WIFI" into Photo hero for a visitor who never typed anything.

## Decision
`loadTemplate(template)` maps content by position:
- The current i-th text block's `text` goes to the new template's i-th text block.
- The current i-th image block's `src` and `alt` go to the new i-th image block.
- A customer photo background carries to a template whose background is also a photo.

Any value that equals one of the templates' own defaults (text strings, image `src`s) is skipped. Colours, sizes and the form always come from the new template.

## Alternatives
- **Carry everything by position:** leaks template copy between templates.
- **Persist a `templateId` or "edited" flags:** new persisted state and a schema or storage change.

## Consequences
The rule is stateless and testable with fixture templates. A customer who typed exactly a template's default text won't have it carried, which is harmless.
