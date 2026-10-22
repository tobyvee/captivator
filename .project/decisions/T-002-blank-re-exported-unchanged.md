---
title: "templates.ts parses the schema's BLANK and re-exports the same object"
type: decision
project: captivator
ticket: T-002
decided_by: main session
supersedes: T-002-blank-is-parsed-copy.md
updated: 2026-10-22
tags: [project, captivator, decision, templates, schema]
---
# templates.ts parses the schema's BLANK and re-exports the same object

## Context
`T-002-blank-is-parsed-copy.md` exported `Template.parse(BLANK)`, a copy, so `@/lib/templates` and `@/lib/design-schema` each exported a `BLANK` with equal values but a different identity. The code review of T-002 flagged it: an `===` or `TEMPLATES.includes(BLANK)` check silently fails if the import comes from the other module. The copy's rationale ("the export isn't the checked value") doesn't hold here, because the schema has no defaults or transforms, so `Template.parse` returns exactly the value it checked.

## Decision
`templates.ts` calls `Template.parse(BLANK)` at module load for its side effect (a broken Blank still fails on import) and re-exports the schema's `BLANK` unchanged. A test asserts the two exports are the same object.

## Alternatives
- Keep the parsed copy: two `BLANK`s with different identities, which every later ticket has to remember.
- Re-export without parsing: drops the ticket's "every template is parsed at module load" rule for Blank.

## Consequences
`BLANK` can be imported from either module. If the schema ever gains a default or transform, re-exporting the input would no longer be the parsed value; at that point, export the parse result and update the identity test.
