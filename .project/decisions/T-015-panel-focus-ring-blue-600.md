---
title: "The Fields and Button panels use Tailwind's blue-600 focus ring, like the rest of the editor chrome"
type: decision
project: captivator
ticket: T-015
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# The Fields and Button panels use Tailwind's blue-600 focus ring, like the rest of the editor chrome

## Context
The T-015 review found two focus-ring colours in this ticket's panels: `ButtonPanel` used `outline-blue-600` and `FieldsPanel` used `outline-[#2563EB]`. With Tailwind 4, `blue-600` is an OKLCH colour, not Tailwind 3's `#2563EB`, so the two rings differ slightly. `ColourField` uses `#2563EB`; `Segmented`, `ImagePanel`, `TextPanel`, `BlockList`, `Switch`, `ImageUpload`, `TopBar` and `Inspector` use `blue-600`.

## Decision
`FieldsPanel`'s focus ring is now `focus-visible:outline-blue-600`, matching `ButtonPanel` and most of the editor. The checkbox's `accent-[#2563EB]` fill isn't a focus ring and is left as it is.

## Alternatives
- **`#2563EB` everywhere in the ticket:** matches only `ColourField`, and the ticket's own inputs would still differ from the panels around them.
- **Change `ColourField` too:** outside this ticket's files; worth a follow-up if one ring is wanted across the editor.

## Consequences
`ColourField` (T-010) remains the one editor control whose ring is `#2563EB`.
