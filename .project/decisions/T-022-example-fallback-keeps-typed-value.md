---
title: "When the Error screen falls back to the example, a value the customer typed stays in the field"
type: decision
project: captivator
ticket: T-022
decided_by: main session
supersedes: T-022-stale-failure-falls-back-to-example.md
updated: 2026-10-23
tags: [project, captivator, decision, splash, editor]
---
# When the Error screen falls back to the example, a value the customer typed stays in the field

## Context
`T-022-stale-failure-falls-back-to-example.md` says that when a stored failure no longer matches the form, "the Error screen shows the example, and so does the first field's `defaultValue`". The re-review showed the second half doesn't happen once the customer has typed in that field: a changed `defaultValue` doesn't replace a value the customer edited (HTML's dirty-value rule). So a valid typed value can sit beside the example's message.

## Decision
Accept it. All rules of the superseded file stand: a failed Connect flags what failed and keeps what was typed; with no stored failure, the switcher's Error shows the example (first field with `EXAMPLE_INVALID`, and terms when on); a failure applies only while its field is in `fields` or its terms still apply, otherwise the screen shows the example; Connect pressed on the example keeps `EXAMPLE_INVALID`; the failure is dropped once the screen isn't `error`; none of it reaches `export`. The one change: the example's value appears only in a field the customer hasn't typed in. A test pins this.

## Alternatives
- **Remount the first field when falling back:** shows the example value but throws away what the customer typed, in the editor's preview of their own design.

## Consequences
In this edge case (the form changed while on Error) the message can sit beside a valid value until the customer leaves the Error screen. It's editor-only; guests never see the example.
