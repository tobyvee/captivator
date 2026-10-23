---
title: "Gradient direction shows icons only, with each label as the button's name and tooltip"
type: decision
project: captivator
ticket: T-039
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Gradient direction shows icons only, with each label as the button's name and tooltip

## Context
The user asked: "On the gradient direction, just use the icons, no need for text". In the Background panel's narrow column, "Top to bottom" and "Left to right" wrapped onto two or three lines.

## Decision
`Segmented` gets an `iconOnly` prop. When it's set, each button shows only its icon, and the label becomes its `aria-label` and `title`. The direction arrows go from 16px to 18px so they read on their own. Only the gradient direction uses it.

## Alternatives
- **Drop the labels from `DIRECTIONS`:** the buttons would have no accessible name.
- **A visually hidden label span instead of `aria-label`:** same result for screen readers, but no tooltip for sighted users.

## Consequences
Other segmented controls keep their text. Any future icon-only group passes `iconOnly` and keeps real labels in its options.
