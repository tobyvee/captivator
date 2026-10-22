---
title: "The colour picker's size and focus overrides are unlayered rules in globals.css"
type: decision
project: captivator
ticket: T-010
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, css]
---
# The colour picker's size and focus overrides are unlayered rules in globals.css

## Context
T-010 needs the react-colorful hue strip at 44px and a visible keyboard focus ring inside the picker. The review found that the Tailwind arbitrary-variant classes never applied. `_` in those variants becomes a space, and react-colorful injects unlayered CSS (`height: 24px`, `outline: none`), which beats any rule in Tailwind's `@layer utilities` whatever its specificity.

## Decision
The popover carries a hook class, `cv-colour-picker`. `src/app/globals.css` (owned by the finished T-001, and claimed by no open ticket) gets two unlayered rules under it: one for the hue height and one for the `:focus-visible` outline. The file joins T-010's `touches`.

## Alternatives
- Escaped arbitrary variants with Tailwind's `!important`: this works, but it is hard to read and relies on `!important`.
- Inline `style` props: react-colorful doesn't expose its inner elements for styling.

## Consequences
Any later override of react-colorful must also be unlayered in `globals.css`. The `cv-` prefix here is editor-only and has nothing to do with the splash's `cv-root` and `cv-terms` classes.
