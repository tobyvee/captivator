---
title: "The Fix acts on the first failure that has one, and its visible text names the target"
type: decision
project: captivator
ticket: T-035
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, contrast, accessibility]
---
# The Fix acts on the first failure that has one, and its visible text names the target

## Context
T-035 says the Fix "acts on the first failure's `target`". Some failures have no Fix: the inputs' edge, and text where no colour reads better than the current one (`T-035-failure-carries-colours.md`). T-035's code review found that when the first failure is one of these, later failures that could be fixed got no Fix at all. One example is a heading on a black-to-white gradient followed by a solid button with an unreadable label. The Notice's title always names the first failure, so a bare "Fix" button under it would suggest it fixes that one.

## Decision
- The Fix acts on the first failure, in reading order, that has a Fix.
- The button's visible text is "Fix {label}", e.g. "Fix Connect button", so it says what it changes even when that isn't the failure in the title.
- The visible text is also the accessible name, so the separate `aria-label` goes.

## Alternatives
- **A Fix for the first failure only, as the ticket says:** a fixable failure can sit behind one that can't be fixed, with no way to reach it.
- **A Fix button for every fixable failure:** a list of buttons in a one-line caption, which the canvas doesn't show.
- **Keep the visible text "Fix", with the target only in `aria-label`:** sighted customers couldn't tell which text it changes.

## Consequences
- The Notice's title and the Fix can name different failures. The title stays on the first failure, and the "{n} more to fix" count is unchanged.
- The button is wider than a bare "Fix", but it still fits the Notice's 420px.
