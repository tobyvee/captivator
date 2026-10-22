---
title: "Store actions save the schema's parsed output, not the candidate object"
type: decision
project: captivator
ticket: T-004
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-22
tags: [project, captivator, decision, store, security, schema]
---
# Store actions save the schema's parsed output, not the candidate object

## Context
`T-004-store-rejects-invalid-designs.md` has every design-changing action run `Design.safeParse`. `BlockPatch` is a union of text and image partials, so `updateBlock(textId, { src })` type-checks, and `updateBackground({ ...photo, type: "colour", colour })` compiles too. Either leaves keys the schema doesn't know in the candidate, which would then be persisted and exported.

## Decision
On success, an action stores `parsed.data` (Zod strips unknown keys), not the object it built. A patch whose known keys are invalid for the block's kind (e.g. an image `size` on a text block) still fails the parse and is refused.

## Alternatives
- **Store the candidate object:** keeps unchanged blocks' identity, but lets stray keys (even a photo's data URL under a colour background) reach localStorage and export.
- **Reject any patch key the block doesn't have:** stricter, but an extra check per action for something the schema already handles.

## Consequences
Each change gives `design` new object identities throughout, so selectors that return a block or the blocks array re-render on every design change; components should select primitives or use `useShallow`. The cost is one small object copy per change.
