---
title: "Only the first error message shown, field before terms, has role=\"alert\""
type: decision
project: captivator
ticket: T-022
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, splash, accessibility]
---
# Only the first error message shown, field before terms, has role="alert"

## Context
T-022 splash audit (warning). The ticket put `role="alert"` only on "Please accept the terms". When only a field failed, nothing was announced. When a field and the terms both failed, only the terms message was read, although the field comes first on the page.

## Decision
The field's message has `role="alert"` whenever it's shown. The terms message has it only when no field is flagged. Both messages stay linked to their controls with `aria-describedby`.

## Alternatives
- **`role="alert"` on both:** two assertive announcements at once, which screen readers interrupt or merge unpredictably.
- **A single live region that sums up every failure:** a new element and new copy that the spec doesn't define.

## Consequences
When both fail, the terms message is read when the guest reaches the checkbox, through its `aria-describedby`, not announced on arrival.
