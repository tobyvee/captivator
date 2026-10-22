---
title: "Store actions drop any update that would make the design fail the schema"
type: decision
project: captivator
ticket: [T-004, T-014, T-015, T-020]
decided_by: ticket-planner
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, persistence, security]
---
# Store actions drop any update that would make the design fail the schema

## Context
`persist`'s `merge` rejects a stored design that fails `Design.safeParse` and sets `restoreFailed` (`general-persistence-versioning-and-flush.md`). Several required strings can be emptied mid-edit: image alt, button label, terms label, link text and body. If one of those were saved, the whole design would be discarded on the next load.

## Decision
- **Store:** every design-changing action builds the next design and runs `Design.safeParse`. On failure, the state is unchanged and the action returns `false` (`null` for `addBlock`).
- **Panels:** panels with required text keep a local draft and show "Required" (or "Describe the image") until the value is non-empty.

## Alternatives
- **Validate only on load:** one emptied field loses the customer's whole design on refresh.
- **Clamp or patch values inside the store:** silently changes what the customer typed.

## Consequences
One schema parse per change. It's cheap, because image `src`s are prefix-matched. The spec's "refuses a third image" and "fields cap at 2" tests pass through this guard. Unsplash results with off-allowlist URLs are dropped the same way.
