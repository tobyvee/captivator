---
title: "The Inspector subscribes to a primitive view of the selection, and panels read their own data, keyed by block id"
type: decision
project: captivator
ticket: [T-008, T-013, T-014, T-015, T-016, T-020]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, client, store]
---
# The Inspector subscribes to a primitive view of the selection, and panels read their own data, keyed by block id

## Context
The Inspector routes on `selection` but needs the selected block's kind and role for its header. Every design action re-parses the design (`T-004-store-keeps-parsed-design.md`), so selecting `design.blocks` or a block object would re-render the Inspector on every colour drag. The panel stubs take only `id` (or nothing), so their later owners have to decide how to get their data.

## Decision
- The Inspector selects `{ kind, id?, role? }` through `useShallow`, so it re-renders only when the header would change.
- Each panel subscribes to its own slice of the store with selectors (`TextPanel` and `ImagePanel` find their block by `id`). Panels change state only through store actions.
- `TextPanel` and `ImagePanel` are rendered with `key={id}`, so local state such as a hex draft or an open popover resets when the selection moves to another block.

## Alternatives
- **Pass the block object down as a prop:** changes the stub props the ticket fixes, and re-renders the whole Inspector on every edit.
- **Select `design.blocks` directly:** a new array after every design change, so the Inspector re-renders on unrelated edits.

## Consequences
T-013 and T-014 read their block with `useStore((s) => s.design.blocks.find((b) => b.id === id))`. They can rely on that block existing while they're mounted, because the Inspector unmounts them once it's gone (`removeBlock` also resets `selection`).
