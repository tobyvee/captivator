---
title: "An outline Connect button's failure reads \"on the background\", not \"on the button\""
type: decision
project: captivator
ticket: T-027
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, contrast]
---
# An outline Connect button's failure reads "on the background", not "on the button"

## Context
The ticket says failures read "{label}: {ratio} on the background", or "on the button" / "on the field" for the Connect label and the field text. An outline button's label is checked against the page, not against `bg` (`T-007-outline-button-colours.md`). "On the button" would send the customer to the button colour, which isn't the problem.

## Decision
A solid button's failure reads "Connect button: {ratio} on the button". An outline button's reads "Connect button: {ratio} on the background".

## Alternatives
- **"on the button" for both:** misleading for an outline button, whose fill is transparent.

## Consequences
Only the copy changes. The failure's `target` is `{ kind: "button" }` either way.
