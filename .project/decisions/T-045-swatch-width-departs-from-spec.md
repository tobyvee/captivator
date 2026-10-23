---
title: "Narrower colour swatches are the user's call, and depart from the spec's 44px editor targets"
type: decision
project: captivator
ticket: T-045
decided_by: user
supersedes: T-045-swatches-one-row.md
updated: 2026-10-23
tags: [project, captivator, decision, editor, accessibility]
---
# Narrower colour swatches are the user's call, and depart from the spec's 44px editor targets

## Context
[`T-045-swatches-one-row.md`](T-045-swatches-one-row.md) recorded the one-row swatch layout as a main-session decision. It said only the guest page has a 44px rule. Review found two problems with that record:
- The spec's Editor UI section also says "Every control is a real `<button>` … with 44px tap targets".
- The change came from the user: "The color chips are too far about. They shouldn't wrap."

The ring also had a 2px outline offset. With the buttons now touching, a focused swatch's ring painted over the next dot.

## Decision
The user asked for tighter, unwrapped colour suggestions. The main session carried it out:
- The title sits above one `flex-nowrap` row of 30×44px buttons around 24px dots, 6px apart.
- The row is pulled 3px left, so the first dot lines up with the title.
- The focus ring has no offset.

For the suggestion swatches only, this departs from the spec's 44px editor targets. They're 30px wide and 44px tall, above WCAG 2.2 AA's 24px minimum (2.5.8). Every other editor control, and the guest page, keeps 44px.

## Alternatives
- **44×44 targets:** eight need 352px, but the narrowest inspector has about 248px, so the row wraps.
- **A title inline with the swatches:** still too wide for eight.

## Consequences
The swatch row fits eight colours at the narrowest inspector. Nothing else in the editor gets narrower targets on the back of this.
