---
title: "Minimal's fields are dark (#18181B with white text), not white, so they stand out from its pale page"
type: decision
project: captivator
ticket: [T-018, T-027]
decided_by: main session
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, templates, contrast]
---
# Minimal's fields are dark (#18181B with white text), not white, so they stand out from its pale page

## Context
T-018's ticket and the `Templates` canvas give Minimal white inputs (`#FFFFFF`, text `#18181B`) on a pale lilac photo under a 35% white wash. The T-018 review measured the inputs' edge against the page at 1.12:1 on the backdrop, 1.72:1 on the photo's average and 2.4:1 at best. `T-027-input-edge-contrast.md` requires 3:1 (WCAG 1.4.11). Minimal ships with two fields, so every customer who picked it would see "Fields: 1.7:1 on the background" before editing anything, and guests would struggle to find the fields. No light input colour can reach 3:1 on a page this pale.

## Decision
Minimal's inputs are `#18181B` with `#FFFFFF` text, matching its dark outline Connect button. A template test now checks every template with fields: `inputBg` must reach 3:1 against `backgroundColours(background)`.

## Alternatives
- Keep white inputs and accept the warning on load: a template shouldn't start out failing a check, or ship fields guests can't see.
- Count a border in T-027's edge check: T-027 rejected this, because inputs have `border: 0` as the canvas shows.
- Darken the page: Minimal's point is a soft, light background.

## Consequences
Minimal's fields look different from the canvas card. T-019's picker thumbnail will show dark fields. The placeholder text, at 65% of white over `#18181B`, stays readable.
