---
title: "templates.ts exports BLANK as the Template.parse output of the schema's BLANK"
type: decision
project: captivator
ticket: T-002
decided_by: ticket-implementer
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, templates, schema]
---
# templates.ts exports BLANK as the Template.parse output of the schema's BLANK

## Context
T-002 asks for `BLANK` to be "re-exported from `design-schema.ts`" and also for every template object to go through `Template.parse(...)` at module load. A plain `export { BLANK }` would skip the parse; parsing it returns a new object.

## Decision
`templates.ts` exports `BLANK = Template.parse(BLANK_TEMPLATE)`, where `BLANK_TEMPLATE` is the schema's `BLANK`. Its values are identical, but it is a different object from `design-schema`'s `BLANK`.

## Alternatives
- `export { BLANK } from "./design-schema"` plus a separate `Template.parse(BLANK)` call: two objects named `BLANK` with the same reference, but the export isn't the checked value.
- Edit `design-schema.ts`: not in `touches`, and no ticket edits it (`T-001-scaffold-owns-dependencies-and-shared-types.md`).

## Consequences
Code that needs the template list should import `BLANK` from `@/lib/templates`, not `@/lib/design-schema`, so `TEMPLATES.includes(BLANK)` and identity checks hold. Compare templates by `id`, not by reference, across the two modules.
