---
title: "Arrow-key moves of the focus dot are announced through a hidden status line, so FocusGrid takes 'use client'"
type: decision
project: captivator
ticket: [T-033, T-008, T-010]
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility, client]
---
# Arrow-key moves of the focus dot are announced through a hidden status line, so FocusGrid takes 'use client'

## Context
T-033 says arrow keys move the dot and "announce the new position", and gives the dot the label "Focus point, {x}% across, {y}% down". Screen readers don't reliably re-read the name of a focused button when it changes. A live region that mirrors the value would also talk through every pointer move of a drag.

## Decision
FocusGrid keeps an `sr-only` `role="status"` line that holds "Focus point, {x}% across, {y}% down" after an arrow key, and is emptied when a drag starts or a preset is tapped. The dot's label updates as well. Holding that text needs React state, so FocusGrid now carries `"use client"`, by the rule in `T-008-use-client-on-stateful-modules.md` that `T-010-colourfield-keeps-use-client.md` said would apply if FocusGrid gained state.

## Alternatives
- **Label change only:** silent in some screen readers.
- **A status line that always mirrors the value:** narrates drags.
- **`role="slider"` on the dot:** one value per slider, and the ticket specifies a button.
- **Write the status text through a ref to stay stateless:** imperative DOM writes to dodge a directive.

## Consequences
Some screen readers may read the position twice (label change and status). Next's TypeScript plugin may flag `onChange` as an unserializable prop on a `'use client'` entry, as with ColourField; FocusGrid is only rendered inside the client editor tree.
