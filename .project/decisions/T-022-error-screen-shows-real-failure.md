---
title: "After a failed edit-mode Connect, the Error screen flags the field and terms that actually failed; the switcher's Error shows the spec's example"
type: decision
project: captivator
ticket: T-022
decided_by: ticket-implementer
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, validation]
---
# After a failed edit-mode Connect, the Error screen flags the field and terms that actually failed; the switcher's Error shows the spec's example

## Context
The ticket draws `screen === "error"` as a fixed example: the first field gets `EXAMPLE_INVALID[kind]` and its message, and the terms row is flagged whenever terms are on. It also has edit-mode Connect validate the preview's own inputs and switch to Error. Taken literally, a customer who fills in the name, ticks the box and types `bob@` as the email would see "Enter your name" on a valid name and "Please accept the terms" beside a ticked box.

## Decision
`Form` keeps the `validateGuest` result of the last failed edit-mode Connect in component state. While the screen is `error`, it flags that result's `field`, keeping what was typed and filling in no example value, and shows the terms message only if `terms` failed. When Error is opened from the switcher, with no stored failure, it shows the spec's example: the first field with `EXAMPLE_INVALID` and, with terms on, the terms row. The stored result is dropped during render as soon as the screen is anything but `error`, so a later visit from the switcher shows the example again. The error state is never drawn in `export` mode.

## Alternatives
- **Always the fixed example:** messages can contradict what the customer just typed or ticked.
- **Keep the failure in the store:** the renderer can't import the store (portability rule), and it would add a store field for one screen.
- **Remount inputs with a key to force the example values:** loses what the customer typed, including a tick made on the Error screen.

## Consequences
What the Error screen shows depends on how it was reached. The inputs are uncontrolled and never remounted, so the switcher's example can show a value the customer typed into the first field, or a box they ticked, next to the error. This affects only the editor's demo view.
