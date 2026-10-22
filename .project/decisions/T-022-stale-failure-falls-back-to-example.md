---
title: "A failure the form can no longer show falls back to the example, and Connect pressed on the example keeps its value"
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes: T-022-error-screen-shows-real-failure.md
updated: 2026-10-23
tags: [project, captivator, decision, splash, validation]
---
# A failure the form can no longer show falls back to the example, and Connect pressed on the example keeps its value

## Context
T-022 code review: a must-fix and a nit against `T-022-error-screen-shows-real-failure.md`.
- **Stale failure:** the stored failure could stop matching the form while the Error screen was up. For example, Connect fails on email and the customer then removes the email field, or only terms failed and terms are then turned off. The Error screen then flagged nothing.
- **Lost example:** pressing Connect on the switcher's example cleared the example value (`sam@`), because a stored failure set `defaultValue` to `undefined`.

## Decision
The earlier rules still apply:
- After a failed edit-mode Connect, the Error screen flags the field and terms that actually failed, keeping what was typed.
- Opened from the switcher, with no stored failure, it shows the spec's example: the first field with `EXAMPLE_INVALID` and, with terms on, the terms row.
- The stored failure is dropped during render once the screen isn't `error`.
- The error state never reaches `export`.

On top of these:
- A stored failure applies only while its field is still in `fields` or its terms failure still applies (terms on). Otherwise the Error screen shows the example, and so does the first field's `defaultValue`.
- The stored failure records whether Connect was pressed on the example. If it was, the first field keeps `EXAMPLE_INVALID` as its `defaultValue`, so the value the customer saw isn't cleared.

## Alternatives
- **Clear the failure when the form changes:** needs an effect or a stored copy of the form to compare against, to get the same result.
- **Filter the stale part out but keep the rest:** with a stale field and terms that no longer apply, nothing is left to show, which is the bug.

## Consequences
What the Error screen shows still depends on how it was reached. After the form changes on the Error screen, it can return to the example.
