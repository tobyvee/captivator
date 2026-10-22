---
title: "Every block-list row is a wrapper holding a full-width select button, with move buttons and the Terms switch as its siblings"
type: decision
project: captivator
ticket: T-012
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Every block-list row is a wrapper holding a full-width select button, with move buttons and the Terms switch as its siblings

## Context
The `Main` artboard draws block rows as single `<button>`s with drag handles, and only the Terms row as a `<div>` holding a button and a switch. T-012 ships up/down buttons instead of drag handles, and a button can't be nested in another button. Inside its padding the column is 240–268px wide, and every tap target must be at least 44px.

## Decision
- One `Row` component for all rows: a `<div>` carrying the row look (48px tall, 8px radius, grey when pinned or white, blue when selected) with a select `<button>` that fills it (`aria-current="true"` when selected), and any controls after it as siblings.
- Move Up and Move Down are 44×44 buttons side by side at the row's right end. The summary truncates to fit.
- After a move, focus returns to the same block's button in the same direction, or to its other button when that one is now disabled at the end. Without this, React moving the row in the DOM, or disabling the button, drops focus to `<body>`.

## Alternatives
- **Move buttons stacked vertically at 22px each:** fits the canvas row height but fails the 44px rule.
- **Smaller move buttons (36px):** more room for the summary, but below the 44px rule.
- **Only the block and Terms rows use a wrapper:** two row shapes for one look; a single component keeps them identical.

## Consequences
The row's border sits on the wrapper, so the selected style covers the whole row, controls included. T-034's drag handle goes inside the wrapper, beside the select button.
