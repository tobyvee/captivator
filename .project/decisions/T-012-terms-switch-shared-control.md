---
title: "The Terms on/off switch is one shared control, src/editor/controls/TermsSwitch.tsx, used by the block list and the inspector"
type: decision
project: captivator
ticket: [T-012, T-008]
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, client]
---
# The Terms on/off switch is one shared control, src/editor/controls/TermsSwitch.tsx, used by the block list and the inspector

## Context
T-012's review found that the block list's Terms row and the Terms inspector header (`Inspector.tsx`, T-008) each wired `Switch` to `updateForm({ terms: { mode } })` with the same label. Two copies could drift on the label or the mode mapping.

## Decision
- `TermsSwitch` moves from `Inspector.tsx` into `src/editor/controls/TermsSwitch.tsx`, and both places render it.
- It reads the store itself, so it has `"use client"` under `T-008-use-client-on-stateful-modules.md` (as `T-010-colourfield-keeps-use-client.md` did for ColourField). It takes no props.

## Alternatives
- **Keep both copies:** the drift risk above.
- **A prop-only switch with the store wiring left at each call site:** still duplicates the selector and the mode mapping, which is the part that matters.

## Consequences
`BlockList` no longer subscribes to `updateForm`. A change to the Terms switch's label or behaviour is made once, and `BlockList.test.tsx` and `editor.test.tsx` both cover it.
